import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils.js/const";

const Complaints = ({ token, user, onLogout }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amountDisputed: "",
    targetCompany: "",
    targetCompanyEmail: "",
    status: "Pending",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const endpoint =
          user?.role === "supplier" ? "complaints/supplier" : "complaints/all";

        const response = await fetch(`${API_BASE}/${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load complaints");
        }

        setComplaints(data.complaints || []);
      } catch (err) {
        setError(err.message || "Failed to load complaints");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchComplaints();
    }
  }, [token, user?.role]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let response;
      let data;

      // If editingId exists, perform update (PUT), otherwise create (POST)
      if (editingId) {
        response = await fetch(`${API_BASE}/complaints/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to update complaint");
        }

        // Replace updated complaint in state
        setComplaints((prev) =>
          prev.map((c) => (c._id === data.complaint._id ? data.complaint : c))
        );
      } else {
        response = await fetch(`${API_BASE}/complaints`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to create complaint");
        }

        setComplaints((prev) => [data.complaint, ...prev]);
      }

      // Reset form and modal state
      setFormData({
        title: "",
        description: "",
        amountDisputed: "",
        targetCompany: "",
        targetCompanyEmail: "",
        status: "Pending",
      });
      setEditingId(null);
      setShowModal(false);
    } catch (err) {
      setError(
        err.message ||
          (editingId
            ? "Failed to update complaint"
            : "Failed to create complaint")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (complaint) => {
    setEditingId(complaint._id);
    setFormData({
      title: complaint.title || "",
      description: complaint.description || "",
      amountDisputed: complaint.amountDisputed || "",
      targetCompany: complaint.targetCompany || "",
      targetCompanyEmail: complaint.targetCompanyEmail || "",
      status: complaint.status || "Pending",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?"))
      return;

    try {
      const response = await fetch(`${API_BASE}/complaints/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data?.message || "Failed to delete complaint");

      setComplaints((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete complaint");
    }
  };

  return (
    <div className="page">
      <header className="dash-header">
        <div>
          <p className="eyebrow">Complaints dashboard</p>
          <h1>Welcome {user?.name || ""}</h1>
          <p className="muted">{user?.email}</p>
        </div>
        <div className="header-actions">
          {user?.role === "supplier" && (
            <button
              className="primary"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  title: "",
                  description: "",
                  amountDisputed: "",
                  targetCompany: "",
                  targetCompanyEmail: "",
                  status: "Pending",
                });
                setShowModal(true);
              }}
            >
              + New Complaint
            </button>
          )}
          <button className="ghost" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      {loading ? (
        <p>Loading complaints...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : complaints.length === 0 ? (
        <p>No complaints found.</p>
      ) : (
        <div className="list">
          {complaints.map((complaint) => {
            const creatorObj = complaint.createdBy ? complaint.createdBy : null;
            const creatorId = creatorObj && creatorObj._id;

            const canEdit =
              (user?.role === "supplier" && creatorId === user.id) ||
              user?.role === "admin";
            const canDelete = user?.role === "admin";

            const showCreatorName = user?.role !== "supplier";

            return (
              <article key={complaint._id} className="list-item">
                <div>
                  <p className="eyebrow">{complaint.status}</p>
                  <h2>{complaint.title}</h2>
                  <p className="muted">{complaint.description}</p>
                  {showCreatorName && (
                    <p className="muted">
                      Created by:{" "}
                      {creatorObj.name ||
                        creatorObj.companyName ||
                        creatorObj.email}
                    </p>
                  )}
                </div>
                <div className="badge">{complaint.targetCompany}</div>
                <div className="item-actions">
                  {canEdit && (
                    <button
                      className="ghost"
                      onClick={() => handleEditClick(complaint)}
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="danger"
                      onClick={() => handleDelete(complaint._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowModal(false);
            setEditingId(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Edit Complaint" : "Create New Complaint"}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label htmlFor="title">Complaint Title *</label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Brief title of the complaint"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Detailed description of the complaint"
                  rows="5"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="targetCompany">Target Company *</label>
                <input
                  id="targetCompany"
                  type="text"
                  name="targetCompany"
                  value={formData.targetCompany}
                  onChange={handleFormChange}
                  placeholder="Name of the company"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  required
                >
                  {user?.role === "admin" ? (
                    <>
                      <option value="">Select status</option>
                      <option value="Pending">Pending</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </>
                  ) : (
                    <>
                      <option value="Pending">Pending</option>
                      <option value="Resolved">Resolved</option>
                    </>
                  )}
                </select>
              </div>

              <div className="field">
                <label htmlFor="targetCompanyEmail">Company Email*</label>
                <input
                  id="targetCompanyEmail"
                  type="email"
                  name="targetCompanyEmail"
                  value={formData.targetCompanyEmail}
                  onChange={handleFormChange}
                  placeholder="Email of the company"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="amountDisputed">Amount Disputed</label>
                <input
                  id="amountDisputed"
                  type="number"
                  name="amountDisputed"
                  value={formData.amountDisputed}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              {error && <p className="error">{error}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={submitting}>
                  {submitting
                    ? editingId
                      ? "Saving..."
                      : "Creating..."
                    : editingId
                    ? "Save Changes"
                    : "Create Complaint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
