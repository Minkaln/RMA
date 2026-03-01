import React, { useEffect, useState } from 'react';
import axios from 'axios';

// 1. Configure the API instance globally
const api = axios.create({
    baseURL: 'http://localhost:8080'
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authHeader');
    if (token) {
        config.headers.Authorization = token;
    }
    return config;
});

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', type: '', status: 'Available' });

    useEffect(() => {
        const token = localStorage.getItem('authHeader');
        if (token) {
            // Force the header directly into the instance
            api.defaults.headers.common['Authorization'] = token;
            setIsLoggedIn(true);
        }
    }, []);

    // --- FETCH DATA ---
    const fetchRooms = () => {
        api.get('/api/rooms')
            .then(res => setRooms(Array.isArray(res.data) ? res.data : []))
            .catch(err => {
                if (err.response?.status === 401) {
                    console.error("Session expired");
                    handleLogout();
                }
            });
    };

    useEffect(() => {
        if (isLoggedIn) fetchRooms();
    }, [isLoggedIn]);

    // --- HANDLERS ---
    const handleLogin = (e) => {
        e.preventDefault();
        const token = btoa(`${credentials.username}:${credentials.password}`);
        const authHeader = `Basic ${token}`;

        // Test the credentials
        axios.get('http://localhost:8080/api/rooms', {
            headers: { 'Authorization': authHeader }
        })
            .then(res => {
                localStorage.setItem('authHeader', authHeader);
                setRooms(res.data);
                setIsLoggedIn(true);
            })
            .catch(err => alert("Login Failed"));
    };

    const handleLogout = () => {
        localStorage.removeItem('authHeader');
        setIsLoggedIn(false);
        setRooms([]);
        setCredentials({ username: '', password: '' });
    };

    const handleAddRoom = (e) => {
        e.preventDefault();
        api.post('/api/rooms', newRoom)
            .then(() => {
                alert("Room added!");
                fetchRooms();
                setNewRoom({ roomNumber: '', type: '', status: 'Available' });
            })
            .catch(err => alert("Error adding room: " + (err.response?.data || err.message)));
    };

    const handleDirectCheckIn = (roomId) => {
        const name = prompt("Guest Name for Walk-in:");
        if (!name) return;
        api.post(`/api/rooms/${roomId}/check-in-direct`, { guestName: name })
            .then(() => {
                alert("Direct Check-in Successful!");
                fetchRooms();
            })
            .catch(err => alert("Direct check-in failed"));
    };

    const handleCheckIn = (roomId) => {
        api.put(`/api/reservations/${roomId}/check-in`)
            .then(() => fetchRooms())
            .catch(err => console.error("CHECKIN FAIL:", err));
    };

    const handleCheckOut = (roomId) => {
        api.put(`/api/reservations/${roomId}/check-out`).then(() => fetchRooms());
    };

    const handleCancel = (roomId) => {
        if (window.confirm("Are you sure you want to CANCEL this booking?")) {
            api.put(`/api/reservations/${roomId}/cancel`).then(() => fetchRooms());
        }
    };
    const handleBookRoom = (roomId) => {
        const name = prompt("Guest Name:");
        const phoneNumber = prompt("Guest Phone Number:");
        const numberOfPeople = prompt("number Of People:");
        if (!name) return;

        api.post('/api/reservations/book', { roomId, guestName: name, phoneNumber: "000", numberOfPeople: 1 })
            .then(() => {
                console.log("Booking successful");
                fetchRooms(); // 👈 The room status will change to 'Reserved' now
            })
            .catch(err => console.error(err));
    };
    const handleDelete = async (id) => {
        if (!id) return;
        if (!window.confirm("Delete?")) return;

        try {
            // Direct call to see if the network tab reacts
            const token = localStorage.getItem('authHeader');
            await axios.delete(`http://localhost:8080/api/rooms/${id}`, {
                headers: { 'Authorization': token }
            });

            alert("Success!");
            fetchRooms();
        } catch (err) {
            console.error("ERROR:", err.response);
            alert("Failed: " + err.message);
        }
    };

    // --- RENDER ---
    if (!isLoggedIn) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
                <form onSubmit={handleLogin} style={{ padding: '40px', background: 'white', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <h2>Staff Verification</h2>
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            style={{ padding: '10px', width: '250px' }}
                            placeholder="Username"
                            onChange={e => setCredentials({...credentials, username: e.target.value})}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            style={{ padding: '10px', width: '250px' }}
                            type="password"
                            placeholder="Password"
                            onChange={e => setCredentials({...credentials, password: e.target.value})}
                            required
                        />
                    </div>
                    <button type="submit" style={{ width: '100%', padding: '10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
                        Verify Account
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Hotel RMA Dashboard</h1>
                <button onClick={handleLogout} style={{ height: '30px', padding: '0 15px', cursor: 'pointer' }}>Logout</button>
            </div>

            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fdfdfd' }}>
                <h3>🛠 System Management (Rooms)</h3>
                <form onSubmit={handleAddRoom} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        placeholder="Room #"
                        value={newRoom.roomNumber}
                        onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})}
                        required
                    />
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
                        <th>Current Guest</th>
                        <th>Last Check-in</th>
                        <th>Last Check-out</th>
                        <th>Actions</th>
                        <th>Admin Only</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rooms.map(room => (
                        <tr key={room.id || room.roomNumber} style={{ borderBottom: '1px solid #eee' }}>
                            <td>{room.roomNumber} ({room.type})</td>
                            <td style={{ color: room.status === 'Available' ? 'green' : 'red', fontWeight: 'bold' }}>
                                {room.status}
                            </td>
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
                                {room.status === 'Occupied' && (
                                    <button onClick={() => handleCheckOut(room.id)} style={{ color: 'green' }}>Check Out</button>
                                )}
                            </td>
                            <td>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDelete(room.id);
                                    }}
                                >
                                    ✖ Delete
                                </button>
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