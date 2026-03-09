AI was used as a technical assistant during the development of this project. The AI was used to accelerate the development lifecycle in the following specific areas:

### 1. Spring Security & CORS Configuration
* **Problem:** Encountered `403 Forbidden` and `CORS` errors when trying to connect the React frontend (Railway) to the Spring Boot backend (Railway).
* **AI Assistance:** Used AI to debug the `SecurityConfig.java` filter chain and implement correct `CorsConfigurationSource` settings to allow pre-flight (OPTIONS) requests.

### 2. JPA Relationship Mapping
* **Problem:** Designing the "One-to-Many" relationship between `Room` and `MaintenanceRequest` entities while avoiding infinite JSON recursion.
* **AI Assistance:** Assisted in implementing `@JsonManagedReference` and `@JsonBackReference` to ensure clean API responses.

### 3. UI Component Refinement
* **Problem:** Creating a responsive "Room Card" grid that changes color based on the `status` string from the backend.
* **AI Assistance:** Suggested Tailwind CSS utility patterns for dynamic conditional styling based on the Room entity's state.

---

* All code suggested by AI was manually reviewed, refactored, and tested.
* The system architecture, database schema, and controller logic were designed and directed by me.
* This tool was used to enhance productivity and resolve specific technical roadblocks, not as a replacement for original development effort.
