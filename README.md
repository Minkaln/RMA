# Hotel Room Management Administrative

A full-stack management application for tracking hotel rooms, guest reservations, and maintenance tasks. This system is designed to automate manual record-keeping through a real-time digital dashboard.



## Live Deployment
* **Website:** [RMA](rma-frontend-production.up.railway.app)


## Tech Stack
This project utilizes a modern **Full-Stack** architecture:

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Axios |
| **Backend** | Java, Spring Boot, Spring Security |
| **Database** | Postgre (Hosted on Railway) |
| **Deployment** | Railway |
| **Version Control** | GitHub |

---

## Deployment Guide (Railway)

### 1. Database Provisioning
1. Add a **MySQL** service to your Railway project.
2. Railway automatically generates variables like `MYSQL_URL`, `MYSQLUSER`, and `MYSQLPASSWORD`.

### 2. Backend Configuration
1. Connect your GitHub repository to a new Railway Service.
2. In the **Variables** tab, map your Spring Boot properties to the Railway Database variables:
   * `SPRING_DATASOURCE_URL`: `${{MySQL.MYSQL_URL}}`
   * `SPRING_DATASOURCE_USERNAME`: `${{MySQL.MYSQLUSER}}`
   * `SPRING_DATASOURCE_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   * `SERVER_PORT`: `8080`
3. Ensure `SecurityConfig.java` allows the domain of your live frontend for **CORS**.

### 3. Frontend Configuration
1. Connect your frontend folder to a new Railway Service.
2. Set the environment variable:
   * `REACT_APP_API_URL`: `https://rma-production-86dc.up.railway.app`
3. Railway will build the production assets and serve them automatically.

---

## Database Structure
The system uses a relational database to manage hotel operations.



* **Rooms:** Stores room numbers, types, and statuses (`Available`, `Occupied`, `Cleaning`).
* **Reservations:** Manages guest info and links to room records.
* **Maintenance:** Tracks cleaning and repair tasks assigned to specific rooms.

---

## Key Features
* **Real-time Dashboard:** Instant visual updates on room availability.
* **Direct Check-in:** Quick check-in process for walk-in guests.
* **Maintenance Management:** Staff can create and delete specific room cleaning tasks.
* **Security:** Role-based access and CORS protection via Spring Security.
