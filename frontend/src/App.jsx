import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const API_URL = "http://localhost:5000/api/jobs";
  const AUTH_URL = "http://localhost:5000/api";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [authData, setAuthData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [editId, setEditId] = useState(null);
  const [jobs, setJobs] = useState([]);

  const [formData, setFormData] = useState({
    company: "",
    role: "",
    location: "",
    status: "Applied",
    notes: "",
    appliedDate: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthData({
      ...authData,
      [name]: value,
    });
  };

  const handleAuthSubmit = async () => {
    try {
      if (!authData.email || !authData.password || (isRegisterMode && !authData.name)) {
        alert("Please fill all required fields");
        return;
      }

      if (isRegisterMode) {
        await axios.post(`${AUTH_URL}/register`, authData);
        alert("Registered successfully. Now login.");

        setAuthData({
          name: "",
          email: "",
          password: "",
        });

        setIsRegisterMode(false);
      } else {
        const res = await axios.post(`${AUTH_URL}/login`, {
          email: authData.email,
          password: authData.password,
        });

        localStorage.setItem("token", res.data.token);
        setIsLoggedIn(true);

        setAuthData({
          name: "",
          email: "",
          password: "",
        });
      }
    } catch (err) {
      alert(err.response?.data?.error || "Authentication failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get(API_URL);
      setJobs(response.data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchJobs();
    }
  }, [isLoggedIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      company: "",
      role: "",
      location: "",
      status: "Applied",
      notes: "",
      appliedDate: "",
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.company ||
      !formData.role ||
      !formData.location ||
      !formData.appliedDate
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }

      await fetchJobs();
      resetForm();
    } catch (err) {
      console.log("Failed to save job:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      await fetchJobs();
    } catch (err) {
      console.log("Failed to delete job:", err);
    }
  };

  const handleClearAll = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete all job applications?"
    );

    if (!confirmDelete) return;

    try {
      await Promise.all(jobs.map((job) => axios.delete(`${API_URL}/${job._id}`)));
      await fetchJobs();
    } catch (err) {
      console.log("Failed to clear all jobs:", err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const currentJob = jobs.find((job) => job._id === id);
      if (!currentJob) return;

      await axios.put(`${API_URL}/${id}`, {
        company: currentJob.company,
        role: currentJob.role,
        location: currentJob.location,
        status: newStatus,
        notes: currentJob.notes,
        appliedDate: currentJob.appliedDate,
      });

      await fetchJobs();
    } catch (err) {
      console.log("Failed to update status:", err);
    }
  };

  const handleEdit = (job) => {
    setFormData({
      company: job.company,
      role: job.role,
      location: job.location,
      status: job.status,
      notes: job.notes,
      appliedDate: job.appliedDate,
    });
    setEditId(job._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredJobs = jobs
    .filter((job) => {
      return filterStatus === "All" ? true : job.status === filterStatus;
    })
    .filter((job) => {
      const searchValue = searchText.toLowerCase();
      return (
        job.company.toLowerCase().includes(searchValue) ||
        job.role.toLowerCase().includes(searchValue)
      );
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.appliedDate) - new Date(a.appliedDate);
      }
      return new Date(a.appliedDate) - new Date(b.appliedDate);
    });

  const totalJobs = jobs.length;
  const appliedCount = jobs.filter((job) => job.status === "Applied").length;
  const interviewCount = jobs.filter(
    (job) => job.status === "Interview"
  ).length;
  const rejectedCount = jobs.filter((job) => job.status === "Rejected").length;
  const offerCount = jobs.filter((job) => job.status === "Offer").length;

  return (
    <div className="app">
      {!isLoggedIn && (
        <div className="auth-overlay">
          <div className="auth-modal">
            <div className="hero-badge">
              {isRegisterMode ? "✨ Create Account" : "🔐 Secure Login"}
            </div>

            <h2 className="auth-title">
              {isRegisterMode ? "Join Job Tracker" : "Welcome Back"}
            </h2>

            <p className="auth-subtitle">
              {isRegisterMode
                ? "Create your account and start tracking your applications."
                : "Login to continue managing your internship journey."}
            </p>

            <div className="auth-form">
              {isRegisterMode && (
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={authData.name}
                  onChange={handleAuthChange}
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={authData.email}
                onChange={handleAuthChange}
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={authData.password}
                onChange={handleAuthChange}
              />

              <button
                type="button"
                className="save-btn"
                onClick={handleAuthSubmit}
              >
                {isRegisterMode ? "Create Account" : "Login"}
              </button>
            </div>

            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
            >
              {isRegisterMode
                ? "Already have an account? Login"
                : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      )}

      <header className="header">
        <div className="hero-badge">✨ Smart Job Tracking</div>

        <h1>
          Track Your <span>Internship Journey</span>
        </h1>

        <p>
          Organize applications, monitor progress, manage interviews, and never
          miss an opportunity.
        </p>
      </header>

      <div className="dashboard-layout">
        <div className="dashboard-left">
          <section className="stats-grid">
            <div className="stat-card stat-total">
              <div className="stat-icon">📊</div>
              <div>
                <h3>Total</h3>
                <p>{totalJobs}</p>
              </div>
            </div>

            <div className="stat-card stat-applied-card">
              <div className="stat-icon">📝</div>
              <div>
                <h3>Applied</h3>
                <p>{appliedCount}</p>
              </div>
            </div>

            <div className="stat-card stat-interview-card">
              <div className="stat-icon">🎯</div>
              <div>
                <h3>Interview</h3>
                <p>{interviewCount}</p>
              </div>
            </div>

            <div className="stat-card stat-rejected-card">
              <div className="stat-icon">❌</div>
              <div>
                <h3>Rejected</h3>
                <p>{rejectedCount}</p>
              </div>
            </div>

            <div className="stat-card stat-offer-card">
              <div className="stat-icon">🏆</div>
              <div>
                <h3>Offer</h3>
                <p>{offerCount}</p>
              </div>
            </div>
          </section>

          <section className="controls-panel">
            <div className="controls-top">
              <button className="add-btn" onClick={() => setShowForm(!showForm)}>
                {showForm ? "Close Form" : "+ Add Job"}
              </button>

              <button className="clear-btn" onClick={handleClearAll}>
                Clear All
              </button>
            </div>

            <div className="controls-middle">
              <div className="filter-bar">
                <button
                  className={
                    filterStatus === "All" ? "filter-btn active" : "filter-btn"
                  }
                  onClick={() => setFilterStatus("All")}
                >
                  All
                </button>

                <button
                  className={
                    filterStatus === "Applied"
                      ? "filter-btn active"
                      : "filter-btn"
                  }
                  onClick={() => setFilterStatus("Applied")}
                >
                  Applied
                </button>

                <button
                  className={
                    filterStatus === "Interview"
                      ? "filter-btn active"
                      : "filter-btn"
                  }
                  onClick={() => setFilterStatus("Interview")}
                >
                  Interview
                </button>

                <button
                  className={
                    filterStatus === "Rejected"
                      ? "filter-btn active"
                      : "filter-btn"
                  }
                  onClick={() => setFilterStatus("Rejected")}
                >
                  Rejected
                </button>

                <button
                  className={
                    filterStatus === "Offer"
                      ? "filter-btn active"
                      : "filter-btn"
                  }
                  onClick={() => setFilterStatus("Offer")}
                >
                  Offer
                </button>
              </div>
            </div>

            <div className="controls-bottom">
              <input
                type="text"
                className="search-input"
                placeholder="Search by company or role"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              <select
                className="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <div className="controls-top" style={{ marginTop: "16px", marginBottom: 0 }}>
              <button className="clear-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </section>

          {showForm && (
            <section className="form-section">
              <h2>{editId ? "Edit Job" : "Add New Job"}</h2>
              <form className="job-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="company"
                  placeholder="Company Name"
                  value={formData.company}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="role"
                  placeholder="Role"
                  value={formData.role}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="location"
                  placeholder="Location"
                  value={formData.location}
                  onChange={handleChange}
                />

                <input
                  type="date"
                  name="appliedDate"
                  value={formData.appliedDate}
                  onChange={handleChange}
                />

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option>Applied</option>
                  <option>Interview</option>
                  <option>Rejected</option>
                  <option>Offer</option>
                </select>

                <textarea
                  name="notes"
                  placeholder="Notes (optional)"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                ></textarea>

                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    {editId ? "Update Job" : "Save Job"}
                  </button>

                  {editId && (
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>
          )}
        </div>

        <div className="dashboard-right">
          <section className="jobs-section">
            <h2>My Applications</h2>

            {filteredJobs.length === 0 ? (
              <div className="empty-box">
                <p>No job applications found.</p>
              </div>
            ) : (
              <div className="jobs-list">
                {filteredJobs.map((job) => (
                  <div className="job-card" key={job._id}>
                    <div className="job-header">
                      <h3>{job.company}</h3>
                      <span
                        className={`status-badge badge-${job.status.toLowerCase()}`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <p className="job-role">{job.role}</p>

                    <div className="job-meta">
                      <span>📍 {job.location}</span>
                      <span>📅 {job.appliedDate}</span>
                    </div>

                    <div className="status-row">
                      <strong>Status:</strong>
                      <select
                        className={`status-select status-${job.status.toLowerCase()}`}
                        value={job.status}
                        onChange={(e) =>
                          handleStatusChange(job._id, e.target.value)
                        }
                      >
                        <option>Applied</option>
                        <option>Interview</option>
                        <option>Rejected</option>
                        <option>Offer</option>
                      </select>
                    </div>

                    {job.notes && <p className="job-notes">📝 {job.notes}</p>}

                    <div className="card-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(job)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(job._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;