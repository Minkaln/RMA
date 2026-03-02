import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', type: 'Single', status: 'Available' });
    const [expandedRoomId, setExpandedRoomId] = useState(null);

    // Error state for adding rooms
    const [addRoomError, setAddRoomError] = useState("");

    // Modal States
    const [activeModal, setActiveModal] = useState(null);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [formData, setFormData] = useState({ guestName: '', phoneNumber: '', supplyItem: '' });

    const fetchRooms = () => {
        setLoading(true);
        axios.get('http://localhost:8080/api/rooms')
            .then(res => {
                setRooms(Array.isArray(res.data) ? res.data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setLoading(false);
            });
    };

    useEffect(() => { fetchRooms(); }, []);

    const toggleExpand = (id) => setExpandedRoomId(expandedRoomId === id ? null : id);

    const formatDateTime = (dateString) => {
        if (!dateString) return <span className="text-slate-300">No record</span>;
        const date = new Date(dateString);
        return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- Action Handlers ---
    const closeModals = () => {
        setActiveModal(null);
        setSelectedRoomId(null);
        setFormData({ guestName: '', phoneNumber: '', supplyItem: '' });
    };

    const submitSupplyRequest = (e) => {
        e.preventDefault();
        const requestData = {
            roomId: selectedRoomId,
            requestMessage: formData.supplyItem
        };

        axios.post('http://localhost:8080/api/rooms/request', requestData)
            .then(() => {
                fetchRooms();
                closeModals();
            })
            .catch(err => alert("Request failed: " + err.message));
    };

    const clearRequest = (roomId) => {
        axios.put(`http://localhost:8080/api/rooms/${roomId}/clear-request`)
            .then(() => fetchRooms())
            .catch(err => console.error("Clear request failed:", err));
    };

    const submitBooking = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8080/api/reservations/book', {
            roomId: selectedRoomId, ...formData
        }).then(() => { fetchRooms(); closeModals(); }).catch(() => alert("Error booking room"));
    };

    const submitDirectCheckIn = (e) => {
        e.preventDefault();
        axios.post(`http://localhost:8080/api/reservations/${selectedRoomId}/check-in-direct`, {
            guestName: formData.guestName,
            phoneNumber: formData.phoneNumber
        }).then(() => { fetchRooms(); closeModals(); }).catch(err => alert("Direct check-in failed"));
    };

    const confirmAction = () => {
        if (activeModal === 'cancel') {
            axios.put(`http://localhost:8080/api/reservations/room/${selectedRoomId}/cancel`)
                .then(() => { fetchRooms(); closeModals(); })
                .catch(err => alert("Cancellation failed: " + err.message));
        } else if (activeModal === 'delete') {
            axios.delete(`http://localhost:8080/api/rooms/${selectedRoomId}`)
                .then(() => { fetchRooms(); setExpandedRoomId(null); closeModals(); })
                .catch(err => alert("Delete failed"));
        }
    };

    const handleCheckIn = (roomId) => {
        axios.put(`http://localhost:8080/api/reservations/${roomId}/check-in`)
            .then(() => fetchRooms())
            .catch(err => alert("Check-in failed: " + err.message));
    };

    const handleCheckOut = (roomId) => {
        axios.put(`http://localhost:8080/api/reservations/${roomId}/check-out`)
            .then(() => fetchRooms());
    };

    const handleMarkCleaned = (roomId) => {
        axios.put(`http://localhost:8080/api/rooms/${roomId}/clean`)
            .then(() => fetchRooms());
    };

    const handleAddRoom = (e) => {
        e.preventDefault();
        setAddRoomError(""); // Clear previous errors

        axios.post('http://localhost:8080/api/rooms', newRoom)
            .then(() => {
                fetchRooms();
                setNewRoom({ roomNumber: '', type: 'Single', status: 'Available' });
            })
            .catch(err => {
                // Check if backend sent a specific error message
                if (err.response && err.response.status === 500) {
                    setAddRoomError(`Room ${newRoom.roomNumber} already exists.`);
                } else {
                    setAddRoomError("Could not add room. Please try again.");
                }
            });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 mb-8 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-indigo-600 tracking-tight">Hotel RMA</h1>
                        <p className="text-slate-500 font-medium italic underline underline-offset-4 decoration-indigo-200">Admin Dashboard</p>
                    </div>
                    <div className="flex gap-4">
                        <StatCard label="Available" count={rooms.filter(r => r.status === 'Available').length} color="text-green-600" />
                        <StatCard label="Cleaning" count={rooms.filter(r => r.status === 'Cleaning').length} color="text-blue-600" />
                        <StatCard label="Occupied" count={rooms.filter(r => r.status === 'Occupied').length} color="text-rose-600" />
                        <StatCard label="Reserved" count={rooms.filter(r => r.status === 'Reserved').length} color="text-amber-600" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <aside className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
                        <h3 className="text-lg font-bold mb-4">Add New Room</h3>
                        <form onSubmit={handleAddRoom} className="space-y-4">
                            <Input
                                label="Room Number"
                                placeholder="e.g. 101"
                                value={newRoom.roomNumber}
                                onChange={val => {
                                    setNewRoom({...newRoom, roomNumber: val});
                                    if(addRoomError) setAddRoomError(""); // Clear error while typing
                                }}
                            />

                            {/* Improved Error UI */}
                            {addRoomError && (
                                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                                    <span className="text-rose-600">⚠️</span>
                                    <span className="text-xs font-bold text-rose-700">{addRoomError}</span>
                                </div>
                            )}

                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-semibold focus:ring-2 focus:ring-indigo-500 transition-all" value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})}>
                                <option value="Single">Single Room</option>
                                <option value="Double">Double Room</option>
                                <option value="Suite">Executive Suite</option>
                            </select>
                            <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]">
                                Create Room
                            </button>
                        </form>
                    </div>
                </aside>

                {/* Main Table */}
                <main className="lg:col-span-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Room Info</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Current Guest</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {rooms.map(room => (
                                <React.Fragment key={room.id}>
                                    <tr onClick={() => toggleExpand(room.id)} className={`cursor-pointer transition-colors ${expandedRoomId === room.id ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-slate-800">Room {room.roomNumber}</div>
                                                {room.currentRequest && (
                                                    <span className={`flex h-2 w-2 rounded-full animate-pulse ${room.currentRequest.includes('Maintenance') ? 'bg-rose-500' : 'bg-orange-500'}`}></span>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">{room.type}</span>
                                                {room.currentRequest && (
                                                    <span className="text-[10px] text-orange-600 font-bold italic mt-0.5">REQ: {room.currentRequest}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Badge status={room.status} /></td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{room.guestName || <span className="text-slate-300 font-normal italic">—</span>}</td>
                                        <td className="px-6 py-4 text-right text-slate-400">
                                            <span className={`transition-transform inline-block ${expandedRoomId === room.id ? 'rotate-180' : ''}`}>▼</span>
                                        </td>
                                    </tr>

                                    {expandedRoomId === room.id && (
                                        <tr className="bg-slate-50/50">
                                            <td colSpan="4" className="px-8 py-6 border-l-4 border-indigo-500 relative">
                                                <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('delete');}} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"><TrashIcon /></button>
                                                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-6 flex-1">
                                                        <DetailItem label="Guest Phone" value={room.phoneNumber || <span className="text-slate-300 italic">No record</span>} />
                                                        <DetailItem label="Check-In" value={formatDateTime(room.currentCheckInTime)} />
                                                        <DetailItem label="Last Check-Out" value={formatDateTime(room.lastCheckOutTime)} />
                                                        {room.currentRequest && (
                                                            <div className="col-span-2 md:col-span-3 bg-orange-50 border border-orange-100 p-3 rounded-xl flex justify-between items-center">
                                                                <div>
                                                                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">Active Room Request</span>
                                                                    <p className="text-sm font-bold text-orange-800">"{room.currentRequest}"</p>
                                                                </div>
                                                                <button onClick={(e) => {e.stopPropagation(); clearRequest(room.id)}} className="text-xs font-black text-orange-600 hover:underline">MARK COMPLETED</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 justify-end bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                                                        <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('supply')}} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200">📦 Request</button>
                                                        {room.status === 'Reserved' && (
                                                            <>
                                                                <button onClick={(e) => {e.stopPropagation(); handleCheckIn(room.id)}} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600">Check In</button>
                                                                <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('cancel');}} className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold hover:bg-rose-100">Cancel</button>
                                                            </>
                                                        )}
                                                        {room.status === 'Available' && (
                                                            <>
                                                                <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('book')}} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">Book</button>
                                                                <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('direct')}} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700">Walk-in</button>
                                                            </>
                                                        )}
                                                        {room.status === 'Occupied' && (
                                                            <button onClick={(e) => {e.stopPropagation(); handleCheckOut(room.id)}} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-black">Check Out</button>
                                                        )}
                                                        {room.status === 'Cleaning' && (
                                                            <button onClick={(e) => {e.stopPropagation(); handleMarkCleaned(room.id)}} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">✨ Mark Clean</button>
                                                        )}
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
                </main>
            </div>

            {/* Modals */}
            {activeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-8 animate-in fade-in zoom-in duration-200 shadow-2xl">
                        {(activeModal === 'cancel' || activeModal === 'delete') ? (
                            <div className="text-center">
                                <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Are you sure?</h2>
                                <p className="text-slate-500 mb-8 text-sm">
                                    This will {activeModal === 'cancel' ? 'cancel this reservation' : 'permanently delete this room'}. This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={closeModals} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Back</button>
                                    <button onClick={confirmAction} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition-colors">Confirm</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-black mb-6 text-slate-800">
                                    {activeModal === 'supply' ? '📦 Room Request' : activeModal === 'book' ? '📅 Reservation' : '⚡ Direct Check-in'}
                                </h2>
                                <form onSubmit={activeModal === 'supply' ? submitSupplyRequest : activeModal === 'book' ? submitBooking : submitDirectCheckIn} className="space-y-4">
                                    {activeModal === 'supply' ? (
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Request Type</label>
                                            <select
                                                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all"
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
                                        <button type="button" onClick={closeModals} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
                                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                                            {activeModal === 'supply' ? 'Send Request' : 'Confirm'}
                                        </button>
                                    </div>
                                </form>
                            </>
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
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${styles[status]}`}>{status}</span>;
};

const DetailItem = ({ label, value }) => (
    <div className="flex flex-col min-w-[140px]">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{label}</span>
        <span className="text-sm font-bold text-slate-700">{value}</span>
    </div>
);

const Input = ({ label, onChange, ...props }) => (
    <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
        <input
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
            {...props}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

export default App;