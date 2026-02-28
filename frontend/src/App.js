import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', type: '', price: '', status: 'Available' });

    // 1. Fetch Rooms
    const fetchRooms = () => {
        axios.get('http://localhost:8080/api/rooms')
            .then(res => setRooms(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchRooms(); }, []);

    // 2. Add Room
    const handleAddRoom = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8080/api/rooms', newRoom)
            .then(() => {
                fetchRooms(); // Refresh the list
                setNewRoom({ roomNumber: '', type: '', price: '', status: 'Available' }); // Clear form
            });
    };

    // 3. Delete Room
    const handleDelete = (id) => {
        axios.delete(`http://localhost:8080/api/rooms/${id}`)
            .then(() => fetchRooms()); // Refresh the list
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>Hotel RMA - Management</h1>

            {/* ADD ROOM FORM */}
            <form onSubmit={handleAddRoom} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
                <h3>Add New Room</h3>
                <input placeholder="Room Number" value={newRoom.roomNumber} onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})} required />
                <input placeholder="Type (e.g. Deluxe)" value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})} required />
                <input placeholder="Price" type="number" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} required />
                <button type="submit">Add Room</button>
            </form>

            {/* ROOM LIST */}
            <h3>Current Rooms</h3>
            <table border="1" cellPadding="10" style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                <tr>
                    <th>Room #</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {rooms.map(room => (
                    <tr key={room.id}>
                        <td>{room.roomNumber}</td>
                        <td>{room.type}</td>
                        <td>${room.price}</td>
                        <td>{room.status}</td>
                        <td>
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