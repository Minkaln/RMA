import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', type: 'Single', status: 'Available' });

    // Modal States
    const [activeModal, setActiveModal] = useState(null); // 'book' or 'direct'
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [formData, setFormData] = useState({
        guestName: '',
        phoneNumber: ''
    });

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
        }).then(() => {
            fetchRooms();
            closeModals();
        }).catch(() => alert("Error booking room"));
    };

    const submitDirectCheckIn = (e) => {
        e.preventDefault();
        axios.post(`http://localhost:8080/api/reservations/${selectedRoomId}/check-in-direct`, {
            guestName: formData.guestName,
            phoneNumber: formData.phoneNumber // 👈 Add this line
        })
            .then(() => {
                fetchRooms();
                closeModals();
            })
            .catch(err => alert("Direct check-in failed: " + err.message));
    };

    const handleCheckIn = (roomId) => axios.put(`http://localhost:8080/api/reservations/${roomId}/check-in`).then(() => fetchRooms());
    const handleCheckOut = (roomId) => axios.put(`http://localhost:8080/api/reservations/${roomId}/check-out`).then(() => fetchRooms());

    const handleAddRoom = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8080/api/rooms', newRoom)
            .then(() => {
                fetchRooms();
                setNewRoom({ roomNumber: '', type: 'Single', status: 'Available' });
            }).catch(err => alert(err.response?.data || "Error"));
    };

    const handleDelete = (id) => {
        if (window.confirm("Delete this room?")) {
            axios.delete(`http://localhost:8080/api/rooms/${id}`).then(() => fetchRooms());
        }
    };
    const handleMarkCleaned = (roomId) => {
        axios.put(`http://localhost:8080/api/rooms/${roomId}/clean`)
            .then(() => fetchRooms())
            .catch(err => console.error("Cleaning update failed", err));
    };
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header / Stats Section */}
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
                {/* Sidebar: Add Room */}
                <aside className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">➕</span> Add New Room
                        </h3>
                        <form onSubmit={handleAddRoom} className="space-y-4">
                            <Input label="Room Number" placeholder="101" value={newRoom.roomNumber} onChange={val => setNewRoom({...newRoom, roomNumber: val})} />
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Type</label>
                                <select
                                    className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})}
                                >
                                    <option value="Single">Single</option>
                                    <option value="Double">Double</option>
                                    <option value="Suite">Suite</option>
                                </select>
                            </div>
                            <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">Create Room</button>
                        </form>
                    </div>
                </aside>

                {/* Main Table */}
                <main className="lg:col-span-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <h3 className="font-bold flex items-center gap-2 text-slate-700"><span>🏨</span> Live Room Matrix</h3>
                            <button onClick={fetchRooms} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400" title="Refresh">🔄</button>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Room Info</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Current Guest</th>
                                <th className="px-6 py-4 text-right">Operations</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {rooms.map(room => (
                                <tr key={room.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-slate-800">Room {room.roomNumber}</div>
                                        <div className="text-xs text-slate-400">{room.type}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge status={room.status} />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-semibold text-slate-600">{room.guestName || <span className="text-slate-300 font-normal italic">—</span>}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-end gap-2">
                                            {room.status === 'Available' && (
                                                <>
                                                    <button onClick={() => {setSelectedRoomId(room.id); setActiveModal('book')}} className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all">Book</button>
                                                    <button onClick={() => {setSelectedRoomId(room.id); setActiveModal('direct')}} className="px-4 py-1.5 bg-teal-50 text-teal-600 border border-teal-100 text-xs font-bold rounded-lg hover:bg-teal-100 transition-all">Walk-in</button>
                                                </>
                                            )}
                                            {room.status === 'Reserved' && (
                                                <button onClick={() => handleCheckIn(room.id)} className="px-4 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-all">Check In</button>
                                            )}
                                            {room.status === 'Occupied' && (
                                                <button onClick={() => handleCheckOut(room.id)} className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-black transition-all">Check Out</button>
                                            )}
                                            {room.status === 'Cleaning' && (
                                                <button
                                                    onClick={() => handleMarkCleaned(room.id)}
                                                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all"
                                                >
                                                    ✨ Mark Cleaned
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(room.id)} className="ml-2 p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">🗑</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {rooms.length === 0 && <div className="p-20 text-center text-slate-400">Inventory is empty. Add a room to start.</div>}
                    </div>
                </main>
            </div>

            {/* --- CUSTOM MODALS --- */}
            {/* --- CUSTOM MODALS --- */}
            {activeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 transform transition-all animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                            {activeModal === 'book' ? '📅 Room Reservation' : '⚡ Direct Check-in'}
                        </h2>
                        <form onSubmit={activeModal === 'book' ? submitBooking : submitDirectCheckIn} className="space-y-4">
                            <Input
                                label="Guest Full Name"
                                placeholder="John Doe"
                                value={formData.guestName}
                                onChange={val => setFormData({...formData, guestName: val})}
                                required
                            />

                            {/* This input now appears for both Booking and Walk-in */}
                            <Input
                                label="Phone Number"
                                placeholder="+1 234..."
                                value={formData.phoneNumber}
                                onChange={val => setFormData({...formData, phoneNumber: val})}
                                required
                            />

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={closeModals} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-components for cleaner code
const StatCard = ({ label, count, color }) => (
    <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex flex-col items-center min-w-[100px]">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
        <span className={`text-2xl font-black ${color}`}>{count}</span>
    </div>
);

const Badge = ({ status }) => {
    const styles = {
        Available: "bg-green-100 text-green-700 border-green-200",
        Reserved: "bg-amber-100 text-amber-700 border-amber-200",
        Occupied: "bg-rose-100 text-rose-700 border-rose-200",
        Cleaning: "bg-blue-100 text-blue-700 border-blue-200" // Add this line
    };
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${styles[status]}`}>{status}</span>;
};

const Input = ({ label, onChange, ...props }) => (
    <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
            {label}
        </label>
        <input
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            {...props}
            // 👈 Extract the value from the event before passing it up
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

export default App;