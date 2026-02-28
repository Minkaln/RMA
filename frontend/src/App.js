import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [rooms, setRooms] = useState([]);

    // 1. UPDATED STATE: Removed 'price' from newRoom
    const [newRoom, setNewRoom] = useState({ roomNumber: '', type: '', status: 'Available' });

    const fetchRooms = () => {
        axios.get('http://localhost:8080/api/rooms')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                setRooms(data);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setRooms([]);
            });
    };

    useEffect(() => { fetchRooms(); }, []);

    const handleCheckIn = (roomId) => {
        axios.put(`http://localhost:8080/api/reservations/${roomId}/check-in`)
            .then(() => fetchRooms())
            .catch(err => alert("Check-in failed"));
    };

    const handleCheckOut = (roomId) => {
        axios.put(`http://localhost:8080/api/reservations/${roomId}/check-out`)
            .then(() => fetchRooms())
            .catch(err => alert("Check-out failed"));
    };

    const handleBookRoom = (roomId) => {
        const name = prompt("Enter Guest Name:");
        if (!name) return;

        const bookingInfo = { roomId: roomId, guestName: name };

        axios.post('http://localhost:8080/api/reservations/book', bookingInfo)
            .then(response => {
                alert(`Success! Reservation created.`);
                fetchRooms();
            })
            .catch(err => alert("Booking failed."));
    };

    const handleAddRoom = (e) => {
        e.preventDefault();
        const duplicate = rooms.find(r => r.roomNumber === newRoom.roomNumber);
        if (duplicate) {
            alert("Error: This room number already exists!");
            return;
        }

        axios.post('http://localhost:8080/api/rooms', newRoom)
            .then(() => {
                fetchRooms();
                // Reset form without price
                setNewRoom({ roomNumber: '', type: '', status: 'Available' });
            })
            .catch(err => alert("Backend Error: Room number must be unique!"));
    };

    const handleDelete = (id) => {
        if(window.confirm("Delete this room?")) {
            axios.delete(`http://localhost:8080/api/rooms/${id}`).then(() => fetchRooms());
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>Hotel RMA - Management</h1>

            {/* 2. UPDATED FORM: Removed the Price input field */}
            <form onSubmit={handleAddRoom} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h3>Add New Room</h3>
                <input
                    placeholder="Room Number"
                    value={newRoom.roomNumber}
                    onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})}
                    required
                />
                <select
                    value={newRoom.type}
                    onChange={e => setNewRoom({...newRoom, type: e.target.value})}
                    required
                    style={{ margin: '0 10px', padding: '5px' }}
                >
                    <option value="">-- Select Type --</option>
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                    <option value="Penthouse">Penthouse</option>
                </select>

                <button type="submit" style={{ cursor: 'pointer' }}>Add Room</button>
            </form>

            {/* TABLE SECTION */}
            <h3>Current Rooms</h3>
            <table border="1" cellPadding="10" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                    <th>Room #</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Current Check-In</th>
                    <th>Last Check-Out</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {Array.isArray(rooms) && rooms.map(room => (
                    <tr key={room.id}>
                        <td>{room.roomNumber}</td>
                        <td>{room.type}</td>
                        <td style={{
                            fontWeight: 'bold',
                            color: room.status === 'Occupied' ? 'red' : room.status === 'Reserved' ? 'orange' : 'green'
                        }}>
                            {room.status}
                        </td>

                        {/* 3. TIME DISPLAY: Using toLocaleString for readability */}
                        <td>{room.currentCheckInTime ? new Date(room.currentCheckInTime).toLocaleString() : '-'}</td>
                        <td>{room.lastCheckOutTime ? new Date(room.lastCheckOutTime).toLocaleString() : '-'}</td>

                        <td>
                            {room.status === 'Available' && (
                                <button onClick={() => handleBookRoom(room.id)} style={{ color: 'blue', marginRight: '5px' }}>Book</button>
                            )}
                            {room.status === 'Reserved' && (
                                <button onClick={() => handleCheckIn(room.id)} style={{ color: 'orange', marginRight: '5px' }}>Check In</button>
                            )}
                            {room.status === 'Occupied' && (
                                <button onClick={() => handleCheckOut(room.id)} style={{ color: 'green', marginRight: '5px' }}>Check Out</button>
                            )}
                            <button onClick={() => handleDelete(room.id)} style={{ color: 'red' }}>Delete</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default App;