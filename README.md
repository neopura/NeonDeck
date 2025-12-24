# NeonDeck 🚀

A modern, high-performance web dashboard for network service discovery and inventory management. 
Discovers active services on your network, probes for HTTP/HTTPS responses, and identifies common services automatically.

![Dashboard Preview](https://raw.githubusercontent.com/placeholder/preview.png)

## ✨ Features

- **Automated Scanning**: Discovers active hosts and services using `nmap`.
- **Intelligent Probing**: Identifies HTTP/HTTPS services and fetches metadata (Title, Description, Favicon).
- **Manual Entry**: Add services and categories that aren't automatically discovered.
- **Responsive UI**: A beautiful, cyber-punk themed dashboard built with React and TailwindCSS.
- **Categorization**: Group services into custom categories for better organization.
- **Soft Delete**: Hide the noise without losing data.

## 🛠️ Technology Stack

- **Frontend**: React, TailwindCSS, Lucide Icons, Vite.
- **Backend**: FastAPI (Python), SQLAlchemy, APScheduler.
- **Database**: PostgreSQL (Production) / SQLite (Development).
- **Tools**: Nmap (for scanning).

## 🚀 Quick Start (Docker Compose)

The easiest way to get started is using Docker Compose.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/internal-dashboard.git
   cd internal-dashboard
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env to set your local network range (e.g., SCAN_NETWORKS=192.168.1.0/24)
   ```

3. **Launch the stack**:
   ```bash
   docker-compose up -d
   ```

The dashboard will be available at `http://localhost:3000`.

## 📂 Project Structure

```text
.
├── backend/            # FastAPI source code
├── frontend/           # React application
├── database/           # SQL initialization scripts
├── docker-compose.yml  # Docker stack configuration
└── README.md           # Documentation
```

## 📝 Configuration

Key variables in `.env`:
- `SCAN_NETWORKS`: Comma-separated list of network ranges to scan (e.g., `192.168.1.0/24,10.0.0.0/24`).
- `SCAN_INTERVAL_MINUTES`: Frequency of automatic network scans.
- `DATABASE_URL`: Connection string for the database.

## 🛡️ License

This project is open-source and available under the MIT License. Feel free to fork it, modify it, and share it!
