import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', type: '', status: 'Available' });

    const fetchRooms = () => {
        axios.get('http://localhost:8080/api/rooms')
            .then(res => setRooms(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchRooms(); }, []);

    // --- NEW: DIRECT CHECK-IN (WALK-IN) ---
    const handleDirectCheckIn = (roomId) => {
        const name = prompt("Guest Name for Walk-in:");
        if (!name) return;

        // Note: Ensure your backend RoomController has the @PostMapping("/{id}/check-in-direct")
        axios.post(`http://localhost:8080/api/rooms/${roomId}/check-in-direct`, { guestName: name })
            .then(() => {
                alert("Direct Check-in Successful!");
                fetchRooms();
            })
            .catch(err => alert("Direct check-in failed: " + err.message));
    };

    const handleBookRoom = (roomId) => {
        const name = prompt("Guest Name:");
        const phone = prompt("Phone Number:");
        const people = prompt("Number of People:");
        if (!name || !phone) return;

        const bookingInfo = {
            roomId: roomId,
            guestName: name,
            phoneNumber: phone,
            numberOfPeople: parseInt(people) || 1
        };

        axios.post('http://localhost:8080/api/reservations/book', bookingInfo)
            .then(() => {
                alert("Room Reserved!");
                fetchRooms();
            }).catch(err => alert("Error booking room"));
    };

    const handleCheckIn = (roomId) => {
        axios.put(`http://localhost:8080/api/reservations/${roomId}/check-in`).then(() => fetchRooms());
    };

    const handleCheckOut = (roomId) => {
        axios.put(`http://localhost:8080/api/reservations/${roomId}/check-out`).then(() => fetchRooms());
    };

    const handleCancel = (roomId) => {
        if (window.confirm("Are you sure you want to CANCEL this booking?")) {
            axios.put(`http://localhost:8080/api/reservations/${roomId}/cancel`)
                .then(() => fetchRooms());
        }
    };

    const handleAddRoom = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8080/api/rooms', newRoom)
            .then(() => {
                alert("Room added successfully!");
                fetchRooms();
                setNewRoom({ roomNumber: '', type: '', status: 'Available' });
            })
            .catch(err => {
                // Check if the server sent a specific error message
                if (err.response && err.response.data) {
                    // This will show: "Failed: Room 121 already exists!"
                    alert("Failed: " + err.response.data);
                } else {
                    alert("An unexpected error occurred.");
                }
            });
    };

    const handleDelete = (id) => {
        if (window.confirm("Delete this room from system?")) {
            axios.delete(`http://localhost:8080/api/rooms/${id}`).then(() => fetchRooms());
        }
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
            <h1>Hotel RMA Dashboard</h1>

            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fdfdfd' }}>
                <h3>🛠 System Management (Rooms)</h3>
                <form onSubmit={handleAddRoom} style={{ display: 'flex', gap: '10px' }}>
                    <input placeholder="Room #" value={newRoom.roomNumber} onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})} required />
                    <select value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})} required>
                        <option value="">Type</option>
                        <option value="Single">Single</option>
                        <option value="Double">Double</option>
                    </select>
                    <button type="submit">Add to Inventory</button>
                </form>
            </div>

            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                <h3>🏨 Front Desk Operations</h3>
                <table width="100%" cellPadding="10" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ textAlign: 'left', backgroundColor: '#f2f2f2' }}>
                        <th>Room</th>
                        <th>Status</th>
                        {/* FIX: New columns for Check-in/out times */}
                        <th>Current Guest</th>
                        <th>Last Check-in</th>
                        <th>Last Check-out</th>
                        <th>Actions</th>
                        <th>Admin Only</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rooms.map(room => (
                        <tr key={room.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td>{room.roomNumber} ({room.type})</td>
                            <td style={{ color: room.status === 'Available' ? 'green' : 'red', fontWeight: 'bold' }}>
                                {room.status}
                            </td>
                            {/* FIX: Mapping data to the new columns */}
                            <td>{room.guestName || '-'}</td>
                            <td>{room.currentCheckInTime ? new Date(room.currentCheckInTime).toLocaleString() : '-'}</td>
                            <td>{room.lastCheckOutTime ? new Date(room.lastCheckOutTime).toLocaleString() : '-'}</td>
                            <td>
                                {room.status === 'Available' && (
                                    <>
                                        <button onClick={() => handleBookRoom(room.id)}>Book</button>
                                        <button onClick={() => handleDirectCheckIn(room.id)} style={{ marginLeft: '5px', backgroundColor: '#e0f7fa' }}>Direct Check-In</button>
                                    </>
                                )}

                                {room.status === 'Reserved' && (
                                    <>
                                        <button onClick={() => handleCheckIn(room.id)} style={{ color: 'orange' }}>Check In</button>
                                        <button onClick={() => handleCancel(room.id)} style={{ marginLeft: '5px' }}>Cancel</button>
                                    </>
                                )}

                                {room.status === 'Occupied' && <button onClick={() => handleCheckOut(room.id)} style={{ color: 'green' }}>Check Out</button>}
                            </td>
                            <td>
                                <button onClick={() => handleDelete(room.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✖ Delete Room</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default App;