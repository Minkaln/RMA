import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', type: 'Single', status: 'Available' });
    const [expandedRoomId, setExpandedRoomId] = useState(null);
    const [addRoomError, setAddRoomError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [openFloors, setOpenFloors] = useState({});

    // Modal States
    const [activeModal, setActiveModal] = useState(null);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [formData, setFormData] = useState({ guestName: '', phoneNumber: '', supplyItem: '' });

    const fetchRooms = () => {
        setLoading(true);
        axios.get('http://localhost:8080/api/rooms')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                setRooms(data);
                // Keep floors open by default
                const initialFloors = {};
                data.forEach(room => {
                    const floor = room.roomNumber.toString().charAt(0);
                    initialFloors[floor] = true;
                });
                setOpenFloors(initialFloors);
                setLoading(false);
            })
            .catch(err => { console.error("Fetch error:", err); setLoading(false); });
    };

    useEffect(() => { fetchRooms(); }, []);

    // --- Search & Grouping Logic ---
    const filteredRooms = rooms.filter(room => {
        const guestMatch = room.guestName?.toLowerCase().includes(searchTerm.toLowerCase());
        const roomMatch = room.roomNumber.toString().includes(searchTerm);
        return guestMatch || roomMatch;
    });

    const groupedRooms = filteredRooms.reduce((acc, room) => {
        const floor = room.roomNumber.toString().charAt(0) || "?";
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(room);
        return acc;
    }, {});

    const floorKeys = Object.keys(groupedRooms).sort();

    // Auto-expand floors during search
    useEffect(() => {
        if (searchTerm !== "") {
            const floorsToOpen = {};
            floorKeys.forEach(f => floorsToOpen[f] = true);
            setOpenFloors(prev => ({ ...prev, ...floorsToOpen }));
        }
    }, [searchTerm]);

    const toggleFloor = (floor) => setOpenFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
    const toggleExpand = (id) => setExpandedRoomId(expandedRoomId === id ? null : id);
    const closeModals = () => {
        setActiveModal(null);
        setSelectedRoomId(null);
        setFormData({ guestName: '', phoneNumber: '', supplyItem: '' });
    };

    // --- Restored Action Handlers ---
    const handleAddRoom = (e) => {
        e.preventDefault();
        setAddRoomError("");
        axios.post('http://localhost:8080/api/rooms', newRoom)
            .then(() => { fetchRooms(); setNewRoom({ roomNumber: '', type: 'Single', status: 'Available' }); })
            .catch(() => setAddRoomError(`Room ${newRoom.roomNumber} already exists.`));
    };

    const submitSupplyRequest = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8080/api/rooms/request', { roomId: selectedRoomId, requestMessage: formData.supplyItem })
            .then(() => { fetchRooms(); closeModals(); });
    };

    const clearRequest = (roomId) => axios.put(`http://localhost:8080/api/rooms/${roomId}/clear-request`).then(() => fetchRooms());
    const handleCheckIn = (roomId) => axios.put(`http://localhost:8080/api/reservations/${roomId}/check-in`).then(() => fetchRooms());
    const handleCheckOut = (roomId) => axios.put(`http://localhost:8080/api/reservations/${roomId}/check-out`).then(() => fetchRooms());
    const handleMarkCleaned = (roomId) => axios.put(`http://localhost:8080/api/rooms/${roomId}/clean`).then(() => fetchRooms());

    const submitBooking = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8080/api/reservations/book', { roomId: selectedRoomId, ...formData })
            .then(() => { fetchRooms(); closeModals(); });
    };

    const submitDirectCheckIn = (e) => {
        e.preventDefault();
        axios.post(`http://localhost:8080/api/reservations/${selectedRoomId}/check-in-direct`, formData)
            .then(() => { fetchRooms(); closeModals(); });
    };

    const confirmAction = () => {
        if (activeModal === 'cancel') {
            axios.put(`http://localhost:8080/api/reservations/room/${selectedRoomId}/cancel`).then(() => { fetchRooms(); closeModals(); });
        } else if (activeModal === 'delete') {
            axios.delete(`http://localhost:8080/api/rooms/${selectedRoomId}`).then(() => { fetchRooms(); setExpandedRoomId(null); closeModals(); });
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return <span className="text-slate-300 font-normal italic">No record</span>;
        const date = new Date(dateString);
        return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 mb-8 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-indigo-600 tracking-tight">Hotel RMA</h1>
                        <p className="text-slate-500 font-medium underline underline-offset-4 decoration-indigo-200">Admin Dashboard</p>
                    </div>
                    <div className="flex gap-4">
                        <StatCard label="Available" count={rooms.filter(r => r.status === 'Available').length} color="text-green-600" />
                        <StatCard label="Cleaning" count={rooms.filter(r => r.status === 'Cleaning').length} color="text-blue-600" />
                        <StatCard label="Occupied" count={rooms.filter(r => r.status === 'Occupied').length} color="text-rose-600" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <aside className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
                        <h3 className="text-lg font-bold mb-4">Add New Room</h3>
                        <form onSubmit={handleAddRoom} className="space-y-4">
                            <Input label="Room Number" value={newRoom.roomNumber} onChange={val => setNewRoom({...newRoom, roomNumber: val})} />
                            {addRoomError && <div className="text-xs font-bold text-rose-500 bg-rose-50 p-2 rounded-lg">{addRoomError}</div>}
                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold" value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})}>
                                <option value="Single">Single</option>
                                <option value="Double">Double</option>
                                <option value="Suite">Suite</option>
                            </select>
                            <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">Create Room</button>
                        </form>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-3 space-y-6">
                    {/* Guest Finder */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Find guest or room..."
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-4 top-4 text-slate-400">🔍</div>
                    </div>

                    {floorKeys.map(floor => (
                        <div key={floor} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                            <button onClick={() => toggleFloor(floor)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-600 text-white h-10 w-10 rounded-xl flex items-center justify-center font-black">{floor}</div>
                                    <h2 className="text-lg font-black text-slate-800">Floor {floor}</h2>
                                </div>
                                <div className={`transform transition-transform ${openFloors[floor] ? 'rotate-180' : ''}`}>▼</div>
                            </button>

                            {openFloors[floor] && (
                                <div className="border-t border-slate-100">
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
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold">Room {room.roomNumber}</div>
                                                            {room.currentRequest && (
                                                                <span className="flex h-2 w-2 rounded-full animate-pulse bg-orange-500"></span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4"><Badge status={room.status} /></td>
                                                    <td className="px-6 py-4 text-sm font-semibold">{room.guestName || <span className="text-slate-200">—</span>}</td>
                                                    <td className="px-6 py-4 text-right">▼</td>
                                                </tr>
                                                {expandedRoomId === room.id && (
                                                    <tr className="bg-slate-50/50">
                                                        <td colSpan="4" className="px-8 py-6 border-l-4 border-indigo-500 relative">
                                                            <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('delete');}} className="absolute top-4 right-4 text-slate-300 hover:text-rose-600"><TrashIcon /></button>

                                                            <div className="flex flex-col gap-6">
                                                                {/* Room Details Grid */}
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-6">
                                                                    <DetailItem label="Guest Phone" value={room.phoneNumber || 'No record'} />
                                                                    <DetailItem label="Check-In" value={formatDateTime(room.currentCheckInTime)} />
                                                                    <DetailItem label="Check-Out" value={formatDateTime(room.lastCheckOutTime)} />
                                                                </div>

                                                                {/* Current Request Section */}
                                                                {room.currentRequest && (
                                                                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                                                                        <div className="flex items-center justify-between">
                                                                            <div>
                                                                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">Active Request</span>
                                                                                <p className="text-sm font-bold text-orange-800 mt-1">"{room.currentRequest}"</p>
                                                                            </div>
                                                                            <button
                                                                                onClick={(e) => {e.stopPropagation(); clearRequest(room.id)}}
                                                                                className="text-xs font-black text-orange-600 hover:underline whitespace-nowrap ml-4"
                                                                            >
                                                                                MARK COMPLETED
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Action Buttons */}
                                                                <div className="flex flex-wrap gap-2 justify-end bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                                                                    <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('supply')}} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200">📦 Request</button>

                                                                    {room.status === 'Reserved' && (
                                                                        <>
                                                                            <button onClick={(e) => {e.stopPropagation(); handleCheckIn(room.id)}} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600">Check In</button>
                                                                            <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('cancel');}} className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold">Cancel</button>
                                                                        </>
                                                                    )}
                                                                    {room.status === 'Available' && (
                                                                        <>
                                                                            <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('book'); setFormData({ guestName: '', phoneNumber: '', supplyItem: '' })}} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">Book</button>
                                                                            <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('direct'); setFormData({ guestName: '', phoneNumber: '', supplyItem: '' })}} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold">Walk-in</button>
                                                                        </>
                                                                    )}
                                                                    {room.status === 'Occupied' && <button onClick={(e) => {e.stopPropagation(); handleCheckOut(room.id)}} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-black">Check Out</button>}
                                                                    {room.status === 'Cleaning' && <button onClick={(e) => {e.stopPropagation(); handleMarkCleaned(room.id)}} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">✨ Mark Clean</button>}
                                                                </div>
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

            {/* Modals Logic Restore */}
            {activeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl">
                        {(activeModal === 'cancel' || activeModal === 'delete') ? (
                            <div className="text-center">
                                <h2 className="text-2xl font-black mb-2">Confirm Action</h2>
                                <p className="text-slate-500 mb-8 text-sm">Are you sure you want to {activeModal === 'cancel' ? 'cancel the reservation' : 'delete the room'}?</p>
                                <div className="flex gap-3">
                                    <button onClick={closeModals} className="flex-1 py-3 border rounded-xl font-bold">Back</button>
                                    <button onClick={confirmAction} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold">Confirm</button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={activeModal === 'supply' ? submitSupplyRequest : activeModal === 'book' ? submitBooking : submitDirectCheckIn} className="space-y-4">
                                <h2 className="text-2xl font-black mb-6">
                                    {activeModal === 'supply' ? '📦 Room Request' : activeModal === 'book' ? '📅 Reservation' : '⚡ Direct Check-in'}
                                </h2>
                                {activeModal === 'supply' ? (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Request Type</label>
                                        <select
                                            className="w-full mt-1 p-3 bg-slate-50 border rounded-xl font-bold"
                                            value={formData.supplyItem}
                                            onChange={(e) => setFormData({...formData, supplyItem: e.target.value})}
                                            required
                                        >
                                            <option value="">-- Choose a service --</option>
                                            <option value="Room Cleaning">✨ Room Cleaning</option>
                                            <option value="Maintenance Needed">🛠️ Maintenance Needed</option>
                                            <option value="Extra Supplies">📦 Extra Supplies</option>
                                            <option value="Laundry Pickup">🧺 Laundry Pickup</option>
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <Input label="Guest Name" value={formData.guestName} onChange={val => setFormData({...formData, guestName: val})} required />
                                        <Input label="Phone Number" value={formData.phoneNumber} onChange={val => setFormData({...formData, phoneNumber: val})} required />
                                    </>
                                )}
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={closeModals} className="flex-1 py-3 border rounded-xl font-bold">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
                                        {activeModal === 'supply' ? 'Send Request' : 'Confirm'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// UI Components
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const StatCard = ({ label, count, color }) => (
    <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 flex flex-col items-center min-w-[100px] shadow-sm">
        <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
        <span className={`text-2xl font-black ${color}`}>{count}</span>
    </div>
);

const Badge = ({ status }) => {
    const styles = {
        Available: "bg-green-100 text-green-700",
        Reserved: "bg-amber-100 text-amber-700",
        Occupied: "bg-rose-100 text-rose-700",
        Cleaning: "bg-blue-100 text-blue-700"
    };
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${styles[status]}`}>{status}</span>;
};

const DetailItem = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</span>
        <span className="text-sm font-bold text-slate-700">{value}</span>
    </div>
);

const Input = ({ label, onChange, ...props }) => (
    <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{label}</label>
        <input
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            {...props}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

export default App;