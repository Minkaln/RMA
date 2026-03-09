    import React, { useEffect, useState } from 'react';
    import axios from 'axios';

    // API Instance with credentials enabled for session cookies
    const api = axios.create({
        baseURL: 'https://rma-production-86dc.up.railway.app/api',
        withCredentials: true
    });

    function App() {
        // 1. ALL HOOKS
        const [rooms, setRooms] = useState([]);
        const [loading, setLoading] = useState(true);
        const [newRoom, setNewRoom] = useState({ roomNumber: '', type: 'Single', status: 'Available' });
        const [expandedRoomId, setExpandedRoomId] = useState(null);
        const [addRoomError, setAddRoomError] = useState("");
        const [searchTerm, setSearchTerm] = useState("");
        const [openFloors, setOpenFloors] = useState({});
        const [activeModal, setActiveModal] = useState(null);
        const [selectedRoomId, setSelectedRoomId] = useState(null);
        const [formData, setFormData] = useState({ guestName: '', phoneNumber: '', supplyItem: '' });
        const [isAuthenticated, setIsAuthenticated] = useState(false);
        const [userRole, setUserRole] = useState("");

        // 2. CORE FUNCTIONS
        const fetchRooms = () => {
            setLoading(true);
            api.get('/rooms')
                .then(res => {
                    const data = Array.isArray(res.data) ? res.data : [];
                    setRooms(data);

                    // Keep existing floor expansion state but initialize if empty
                    const initialFloors = { ...openFloors };
                    data.forEach(room => {
                        if (room.roomNumber) {
                            const floor = room.roomNumber.toString().charAt(0);
                            if (initialFloors[floor] === undefined) initialFloors[floor] = true;
                        }
                    });
                    setOpenFloors(initialFloors);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Fetch error:", err);
                    setLoading(false);
                });
        };

        const getActiveGuest = (room) => {
            if (!room.reservations || room.reservations.length === 0) return null;

            const activeRes = room.reservations.find(res =>
                res.reservationStatus === null ||
                ['Reserved', 'Checked-In', 'Direct-Check-In'].includes(res.reservationStatus)
            );

            return activeRes ? activeRes.guestName : null;
        };

        const getActivePhone = (room) => {
            if (!room.reservations || room.reservations.length === 0) return null;
            const activeRes = room.reservations.find(res =>
                res.reservationStatus === null ||
                ['Reserved', 'Checked-In', 'Direct-Check-In'].includes(res.reservationStatus)
            );
            return activeRes ? activeRes.phoneNumber : null;
        };

        useEffect(() => {
            setLoading(true);
            api.get('/rooms')
                .then(res => {
                    setIsAuthenticated(true);
                    const data = Array.isArray(res.data) ? res.data : [];
                    setRooms(data);
                })
                .catch(() => setIsAuthenticated(false))
                .finally(() => setLoading(false));
        }, []);

        // 4. HANDLERS
        const handleLogout = () => {
            // Try removing the '/auth' prefix
            api.post('/logout')
                .then(() => {
                    setIsAuthenticated(false);
                    setUserRole("");
                    setRooms([]);
                    console.log("Logged out successfully.");
                })
                .catch(err => {
                    console.error("Logout failed:", err);
                    // Forced logout on frontend if backend fails
                    setIsAuthenticated(false);
                });
        };

        const handleAddRoom = (e) => {
            e.preventDefault();
            setAddRoomError("");
            api.post('/rooms', newRoom)
                .then(() => { fetchRooms(); setNewRoom({ roomNumber: '', type: 'Single', status: 'Available' }); })
                .catch(() => setAddRoomError(`Room ${newRoom.roomNumber} already exists.`));
        };

        const submitBooking = (e) => {
            e.preventDefault();
            api.post('/reservations/book', { roomId: selectedRoomId, ...formData })
                .then(() => { fetchRooms(); closeModals(); });
        };

        const submitDirectCheckIn = (e) => {
            e.preventDefault();
            api.post(`/reservations/${selectedRoomId}/check-in-direct`, formData)
                .then(() => { fetchRooms(); closeModals(); });
        };

        const submitSupplyRequest = (e) => {
            e.preventDefault();
            api.post('/rooms/request', { roomId: selectedRoomId, requestMessage: formData.supplyItem })
                .then(() => { fetchRooms(); closeModals(); });
        };

        const confirmAction = () => {
            if (activeModal === 'cancel') {
                api.put(`/reservations/room/${selectedRoomId}/cancel`).then(() => { fetchRooms(); closeModals(); });
            } else if (activeModal === 'delete') {
                api.delete(`/rooms/${selectedRoomId}`).then(() => { fetchRooms(); setExpandedRoomId(null); closeModals(); });
            }
        };

        const handleCheckIn = (roomId) => api.put(`/reservations/${roomId}/check-in`).then(() => fetchRooms());
        const handleCheckOut = (roomId) => api.put(`/reservations/${roomId}/check-out`).then(() => fetchRooms());
        const handleMarkCleaned = (roomId) => api.put(`/rooms/${roomId}/clean`).then(() => fetchRooms());
        const clearRequest = (roomId) => api.put(`/rooms/${roomId}/clear-request`).then(() => fetchRooms());

        const closeModals = () => {
            setActiveModal(null);
            setSelectedRoomId(null);
            setFormData({ guestName: '', phoneNumber: '', supplyItem: '' });
        };

        const toggleFloor = (floor) => setOpenFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
        const toggleExpand = (id) => setExpandedRoomId(expandedRoomId === id ? null : id);

        // 5. DATA FILTERING
        const filteredRooms = rooms.filter(room => {
            const guestName = getActiveGuest(room) || "";
            return guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.roomNumber.toString().includes(searchTerm);
        });

        const groupedRooms = filteredRooms.reduce((acc, room) => {
            const floor = room.roomNumber.toString().charAt(0) || "?";
            if (!acc[floor]) acc[floor] = [];
            acc[floor].push(room);
            return acc;
        }, {});

        const deleteSpecificRequest = (roomId, requestId) => {
            api.delete(`/rooms/${roomId}/requests/${requestId}`)
                .then(() => fetchRooms())
                .catch(err => console.error("Could not delete request:", err));
        };

        const clearAllRoomRequests = (roomId) => {
            api.delete(`/rooms/${roomId}/requests/clear-all`)
                .then(() => fetchRooms())
                .catch(err => console.error("Could not clear requests:", err));
        };
        const floorKeys = Object.keys(groupedRooms).sort();

        // 6. RENDER LOGIC
        if (loading) return <div className="flex h-screen items-center justify-center font-black text-indigo-600 animate-pulse">LOADING SYSTEM...</div>;
        if (!isAuthenticated) return <Login onLoginSuccess={(role) => { setIsAuthenticated(true); setUserRole(role); }} />;

        return (
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 mb-8 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-indigo-600 tracking-tight">Hotel RMA</h1>
                            <p className="text-slate-500 font-medium underline underline-offset-4 decoration-indigo-200">{userRole} Dashboard</p>
                        </div>
                        <div className="flex gap-4">
                            <StatCard label="Available" count={rooms.filter(r => r.status === 'Available').length} color="text-green-600" />
                            <StatCard label="Cleaning" count={rooms.filter(r => r.status === 'Cleaning').length} color="text-blue-600" />
                            <StatCard label="Occupied" count={rooms.filter(r => r.status === 'Occupied').length} color="text-rose-600" />
                        </div>
                        <button onClick={handleLogout} className="text-xs font-bold text-rose-500 hover:text-rose-700 px-4 py-2 border border-rose-200 rounded-xl hover:bg-rose-50 transition-all">Log Out</button>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar - Add Room */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
                            <h3 className="text-lg font-bold mb-4">Add New Room</h3>
                            <form onSubmit={handleAddRoom} className="space-y-4">
                                <Input label="Room Number" value={newRoom.roomNumber} onChange={val => setNewRoom({...newRoom, roomNumber: val})} required />
                                {addRoomError && <div className="text-xs font-bold text-rose-500 bg-rose-50 p-2 rounded-lg">{addRoomError}</div>}
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold" value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})}>
                                    <option value="Single">Single</option>
                                    <option value="Double">Double</option>
                                    <option value="Suite">Suite</option>
                                </select>
                                <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Create Room</button>
                            </form>
                        </div>
                    </aside>

                    {/* Main Content - Room List */}
                    <main className="lg:col-span-3 space-y-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Find guest or room number..."
                                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute left-4 top-4 text-slate-400">🔍</div>
                        </div>

                        {floorKeys.map(floor => (
                            <div key={floor} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm mb-4">
                                <button onClick={() => toggleFloor(floor)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-indigo-600 text-white h-10 w-10 rounded-xl flex items-center justify-center font-black">{floor}</div>
                                        <h2 className="text-lg font-black text-slate-800">Floor {floor}</h2>
                                    </div>
                                    <div className={`transform transition-transform ${openFloors[floor] ? 'rotate-180' : ''}`}>▼</div>
                                </button>

                                {openFloors[floor] && (
                                    <div className="border-t border-slate-100 overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Room</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Guest</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                            {groupedRooms[floor].map(room => (
                                                <React.Fragment key={room.id}>
                                                    <tr onClick={() => toggleExpand(room.id)} className={`cursor-pointer transition-colors ${expandedRoomId === room.id ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}>
                                                        <td className="px-6 py-4 font-bold">Room {room.roomNumber}</td>
                                                        <td className="px-6 py-4"><Badge status={room.status} /></td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-indigo-600">
                                                            {getActiveGuest(room) || <span className="text-slate-200 font-normal">Empty</span>}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-slate-400 text-xs">
                                                            {expandedRoomId === room.id ? '▲' : '▼'}
                                                        </td>
                                                    </tr>
                                                    {expandedRoomId === room.id && (
                                                        <tr className="bg-slate-50/50">
                                                            <td colSpan="4" className="px-8 py-6 border-l-4 border-indigo-500 relative">
                                                                {userRole === 'ADMIN' && (
                                                                    <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('delete');}} className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 transition-colors"><TrashIcon /> DE</button>
                                                                )}
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                    <DetailItem label="Guest Name" value={getActiveGuest(room) || 'N/A'} />
                                                                    <DetailItem label="Guest Phone" value={getActivePhone(room) || 'N/A'} />
                                                                    <DetailItem label="Room Type" value={room.type} />
                                                                </div>
                                                                {room.maintenanceRequests && room.maintenanceRequests.length > 0 && (
                                                                    <div className="mt-6 border-t border-slate-100 pt-4">
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Maintenance</span>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); clearAllRoomRequests(room.id); }}
                                                                                className="text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase"
                                                                            >
                                                                                Clear All
                                                                            </button>
                                                                        </div>
                                                                        <div className="mt-2 space-y-2">
                                                                            {room.maintenanceRequests.map((req) => (
                                                                                <div key={req.id} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-sm font-bold text-slate-700">{req.message}</span>
                                                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                                                            {new Date(req.createdAt).toLocaleTimeString()}
                                                                                        </span>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); deleteSpecificRequest(room.id, req.id); }}
                                                                                        className="p-2 text-slate-300 hover:text-green-600 transition-colors"
                                                                                        title="Complete Task"
                                                                                    >
                                                                                        <CheckCircleIcon />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="flex flex-wrap gap-2 justify-end mt-8 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                                                    <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('supply')}} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200">Request</button>

                                                                    {room.status === 'Available' && (
                                                                        <>
                                                                            <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('book');}} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">Book</button>
                                                                            <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('direct');}} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700">Walk-in</button>
                                                                        </>
                                                                    )}
                                                                    {room.status === 'Reserved' && (
                                                                        <>
                                                                            <button onClick={(e) => {e.stopPropagation(); handleCheckIn(room.id)}} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600">Check In</button>
                                                                            <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('cancel');}} className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold">Cancel</button>
                                                                        </>
                                                                    )}
                                                                    {room.status === 'Occupied' && <button onClick={(e) => {e.stopPropagation(); handleCheckOut(room.id)}} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-black">Check Out</button>}
                                                                    {room.status === 'Cleaning' && <button onClick={(e) => {e.stopPropagation(); handleMarkCleaned(room.id)}} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">Mark Cleaned</button>}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </main>
                </div>

                {/* Modals Section */}
                {activeModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl">
                            {(activeModal === 'cancel' || activeModal === 'delete') ? (
                                <div className="text-center">
                                    <h2 className="text-2xl font-black mb-2">Confirm Action</h2>
                                    <p className="text-slate-500 mb-8 text-sm">This action cannot be undone.</p>
                                    <div className="flex gap-3">
                                        <button onClick={closeModals} className="flex-1 py-3 border rounded-xl font-bold">Go Back</button>
                                        <button onClick={confirmAction} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700">Confirm</button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={activeModal === 'supply' ? submitSupplyRequest : activeModal === 'book' ? submitBooking : submitDirectCheckIn} className="space-y-4">
                                    <h2 className="text-2xl font-black mb-6">{activeModal === 'supply' ? 'Room Request' : activeModal === 'book' ? 'New Reservation' : '⚡ Direct Check-in'}</h2>
                                    {activeModal === 'supply' ? (
                                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={formData.supplyItem} onChange={(e) => setFormData({...formData, supplyItem: e.target.value})} required>
                                            <option value="">-- Select Service --</option>
                                            <option value="Room Cleaning">Room Cleaning</option>
                                            <option value="Maintenance Needed">Maintenance Needed</option>
                                            <option value="Extra Supplies">Extra Supplies</option>
                                        </select>
                                    ) : (
                                        <>
                                            <Input label="Guest Name" value={formData.guestName} onChange={val => setFormData({...formData, guestName: val})} required />
                                            <Input label="Phone Number" value={formData.phoneNumber} onChange={val => setFormData({...formData, phoneNumber: val})} required />
                                        </>
                                    )}
                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={closeModals} className="flex-1 py-3 border rounded-xl font-bold">Cancel</button>
                                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">Confirm</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 7. COMPONENT SUB-SECTIONS
    function Login({ onLoginSuccess }) {
        const [credentials, setCredentials] = useState({ username: '', password: '' });
        const [error, setError] = useState("");

        const handleLogin = (e) => {
            e.preventDefault();
            api.post('/auth/login', credentials)
                .then(res => {
                    onLoginSuccess(res.data);
                })
                .catch(err => {
                    setError(err.response?.data || "Invalid credentials. Try again.");
                });
        };

        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
                <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-sm space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-indigo-600">Hotel RMA</h2>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Management Portal</p>
                    </div>
                    {error && <p className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>}
                    <div className="space-y-4">
                        <input type="text" placeholder="Username" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" onChange={e => setCredentials({...credentials, username: e.target.value})} required />
                        <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" onChange={e => setCredentials({...credentials, password: e.target.value})} required />
                    </div>
                    <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">SIGN IN</button>
                </form>
            </div>
        );
    }

    // UI ATOMS
    const StatCard = ({ label, count, color }) => (
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 flex flex-col items-center min-w-[100px] shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
            <span className={`text-2xl font-black ${color}`}>{count}</span>
        </div>
    );

    const Badge = ({ status }) => {
        const styles = {
            Available: "bg-green-100 text-green-700 border-green-200",
            Reserved: "bg-amber-100 text-amber-700 border-amber-200",
            Occupied: "bg-rose-100 text-rose-700 border-rose-200",
            Cleaning: "bg-blue-100 text-blue-700 border-blue-200"
        };
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${styles[status]}`}>{status}</span>;
    };

    const DetailItem = ({ label, value }) => (
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{label}</span>
            <span className="text-sm font-bold text-slate-700">{value}</span>
        </div>
    );

    const Input = ({ label, onChange, ...props }) => (
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{label}</label>
            <input className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold" {...props} onChange={(e) => onChange(e.target.value)} />
        </div>
    );

    const TrashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );

    const CheckCircleIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );

    export default App;