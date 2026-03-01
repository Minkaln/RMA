import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', type: 'Single', status: 'Available' });
    const [expandedRoomId, setExpandedRoomId] = useState(null);

    // Modal States
    const [activeModal, setActiveModal] = useState(null);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [formData, setFormData] = useState({ guestName: '', phoneNumber: '' });

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

    const toggleExpand = (id) => {
        setExpandedRoomId(expandedRoomId === id ? null : id);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return <span className="text-slate-300">No record</span>;
        const date = new Date(dateString);
        return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- Action Handlers ---
    const closeModals = () => {
        setActiveModal(null);
        setSelectedRoomId(null);
        setFormData({ guestName: '', phoneNumber: '' });
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

    const handleCheckIn = (roomId) => axios.put(`http://localhost:8080/api/reservations/${roomId}/check-in`).then(() => fetchRooms());
    const handleCheckOut = (roomId) => axios.put(`http://localhost:8080/api/reservations/${roomId}/check-out`).then(() => fetchRooms());
    const handleMarkCleaned = (roomId) => axios.put(`http://localhost:8080/api/rooms/${roomId}/clean`).then(() => fetchRooms());
    const handleCancel = (roomId) => {
        if (window.confirm("Cancel this reservation?")) {
            axios.put(`http://localhost:8080/api/reservations/room/${roomId}/cancel`).then(() => fetchRooms());
        }
    };
    const handleDelete = (id) => {
        if (window.confirm("Delete room?")) {
            axios.delete(`http://localhost:8080/api/rooms/${id}`).then(() => fetchRooms());
        }
    };

    const handleAddRoom = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8080/api/rooms', newRoom)
            .then(() => { fetchRooms(); setNewRoom({ roomNumber: '', type: 'Single', status: 'Available' }); })
            .catch(err => alert("Error adding room"));
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 mb-8 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-indigo-600 tracking-tight">Hotel RMA</h1>
                        <p className="text-slate-500 font-medium">Front Desk Control Center</p>
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
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Add New Room</h3>
                        <form onSubmit={handleAddRoom} className="space-y-4">
                            <Input label="Room Number" value={newRoom.roomNumber} onChange={val => setNewRoom({...newRoom, roomNumber: val})} />
                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})}>
                                <option value="Single">Single</option>
                                <option value="Double">Double</option>
                                <option value="Suite">Suite</option>
                            </select>
                            <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">Create</button>
                        </form>
                    </div>
                </aside>

                {/* Compact Table */}
                <main className="lg:col-span-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Room Info</th> {/* Label updated */}
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Guest</th>
                                <th className="px-6 py-4 text-right">Details</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {rooms.map(room => (
                                <React.Fragment key={room.id}>
                                    <tr
                                        onClick={() => toggleExpand(room.id)}
                                        className={`cursor-pointer transition-colors ${expandedRoomId === room.id ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}
                                    >
                                        <td className="px-6 py-4">
                                            {/* Room Type moved here */}
                                            <div className="font-bold text-slate-800">Room {room.roomNumber}</div>
                                            <div className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">{room.type}</div>
                                        </td>
                                        <td className="px-6 py-4"><Badge status={room.status} /></td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{room.guestName || <span className="text-slate-300 font-normal italic">—</span>}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-slate-400 transition-transform inline-block ${expandedRoomId === room.id ? 'rotate-180' : ''}`}>▼</span>
                                        </td>
                                    </tr>

                                    {/* Dropdown Section */}
                                    {expandedRoomId === room.id && (
                                        <tr className="bg-slate-50/50">
                                            <td colSpan="4" className="px-8 py-6 border-l-4 border-indigo-500 shadow-inner">
                                                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-6 w-full md:w-auto">
                                                        <DetailItem label="Guest Phone" value={room.phoneNumber || 'N/A'} />
                                                        <DetailItem label="Check-In Time" value={formatDateTime(room.currentCheckInTime)} />
                                                        <DetailItem label="Last Check-Out" value={formatDateTime(room.lastCheckOutTime)} />
                                                        <DetailItem label="Internal ID" value={`#${room.id}`} />
                                                    </div>

                                                    {/* Actions Panel */}
                                                    <div className="flex flex-wrap gap-2 justify-end bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                                        {room.status === 'Available' && (
                                                            <>
                                                                <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('book')}} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">Book</button>
                                                                <button onClick={(e) => {e.stopPropagation(); setSelectedRoomId(room.id); setActiveModal('direct')}} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-all">Walk-in</button>
                                                            </>
                                                        )}
                                                        {room.status === 'Reserved' && (
                                                            <>
                                                                <button onClick={(e) => {e.stopPropagation(); handleCheckIn(room.id)}} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600">Check In</button>
                                                                <button onClick={(e) => {e.stopPropagation(); handleCancel(room.id)}} className="px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold">Cancel</button>
                                                            </>
                                                        )}
                                                        {room.status === 'Occupied' && (
                                                            <button onClick={(e) => {e.stopPropagation(); handleCheckOut(room.id)}} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold">Check Out</button>
                                                        )}
                                                        {room.status === 'Cleaning' && (
                                                            <button onClick={(e) => {e.stopPropagation(); handleMarkCleaned(room.id)}} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold">✨ Done Cleaning</button>
                                                        )}
                                                        <button onClick={(e) => {e.stopPropagation(); handleDelete(room.id)}} className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors">🗑</button>
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

            {/* Modals remain the same */}
            {activeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-8 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-black mb-6">{activeModal === 'book' ? '📅 Reservation' : '⚡ Direct Check-in'}</h2>
                        <form onSubmit={activeModal === 'book' ? submitBooking : submitDirectCheckIn} className="space-y-4">
                            <Input label="Guest Name" value={formData.guestName} onChange={val => setFormData({...formData, guestName: val})} required />
                            <Input label="Phone Number" value={formData.phoneNumber} onChange={val => setFormData({...formData, phoneNumber: val})} required />
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={closeModals} className="flex-1 py-3 border rounded-xl font-bold text-slate-500">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Stats & Sub-components stay exactly as you have them...
const StatCard = ({ label, count, color }) => (
    <div className="bg-slate-50 px-6 py-3 rounded-2xl border flex flex-col items-center min-w-[100px]">
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
        <input className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" {...props} onChange={(e) => onChange(e.target.value)} />
    </div>
);

export default App;