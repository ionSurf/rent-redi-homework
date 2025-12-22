import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { UserRepository } from '../repositories/UserRepository';
import './UserManagement.css';

function UserManagement() {
  const { users, loading } = useUsers();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', zip: '' });
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const validateForm = () => {
    const newErrors = {};

    // Name validation with detailed feedback
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length === 0) {
      newErrors.name = 'Name cannot be empty or only spaces';
    } else if (formData.name.length < 2) {
      newErrors.name = `Name must be at least 2 characters (currently ${formData.name.length})`;
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name cannot exceed 100 characters';
    }

    // ZIP code validation with detailed feedback
    if (!formData.zip) {
      newErrors.zip = 'ZIP code is required';
    } else if (!/^\d{5}$/.test(formData.zip)) {
      if (!/^\d+$/.test(formData.zip)) {
        newErrors.zip = 'ZIP code must contain only numbers (e.g., 10001)';
      } else if (formData.zip.length < 5) {
        newErrors.zip = `ZIP code must be exactly 5 digits (${formData.zip.length}/5)`;
      } else if (formData.zip.length > 5) {
        newErrors.zip = `ZIP code must be exactly 5 digits (too long: ${formData.zip.length})`;
      } else {
        newErrors.zip = 'ZIP code must be a valid 5-digit US ZIP code (e.g., 10001, 90210)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation helper
  const validateField = (fieldName, value) => {
    const fieldErrors = {};

    if (fieldName === 'name') {
      if (!value) {
        fieldErrors.name = 'Name is required';
      } else if (value.trim().length === 0) {
        fieldErrors.name = 'Name cannot be empty or only spaces';
      } else if (value.length < 2) {
        fieldErrors.name = `Name must be at least 2 characters (currently ${value.length})`;
      } else if (value.length > 100) {
        fieldErrors.name = 'Name cannot exceed 100 characters';
      }
    }

    if (fieldName === 'zip') {
      if (!value) {
        fieldErrors.zip = 'ZIP code is required';
      } else if (!/^\d{5}$/.test(value)) {
        if (!/^\d+$/.test(value)) {
          fieldErrors.zip = 'ZIP code must contain only numbers';
        } else if (value.length < 5) {
          fieldErrors.zip = `ZIP code must be 5 digits (${value.length}/5)`;
        } else if (value.length > 5) {
          fieldErrors.zip = 'ZIP code must be exactly 5 digits';
        }
      }
    }

    return fieldErrors;
  };

  // Handle input change with real-time validation
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });

    // Clear submit error when user starts typing
    if (errors.submit) {
      setErrors({ ...errors, submit: undefined });
    }

    // Real-time validation for this field
    const fieldErrors = validateField(field, value);
    setErrors({ ...errors, ...fieldErrors, submit: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingUser) {
        await UserRepository.updateUser(editingUser.id, formData.name, formData.zip);
      } else {
        await UserRepository.createUser(formData.name, formData.zip);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving user:', error);
      setErrors({ submit: error.message || 'Failed to save user' });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, zip: user.zip });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await UserRepository.deleteUser(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', zip: '' });
    setErrors({});
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.zip?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="management-header">
        <div>
          <h1>User Management</h1>
          <p>Manage tenants and landlords in your system</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add User
        </button>
      </div>

      <div className="search-bar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name or ZIP code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>{searchTerm ? 'No users found matching your search' : 'No users yet. Click "Add User" to get started!'}</p>
        </div>
      ) : (
        <div className="users-table">
          <div className="table-header">
            <div className="col-name">Name</div>
            <div className="col-zip">ZIP Code</div>
            <div className="col-location">Location</div>
            <div className="col-timezone">Time Zone</div>
            <div className="col-actions">Actions</div>
          </div>
          <div className="table-body">
            {filteredUsers.map((user) => (
              <div key={user.id} className="table-row">
                <div className="col-name">
                  <div className="user-avatar-small">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                </div>
                <div className="col-zip">{user.zip}</div>
                <div className="col-location">
                  {user.latitude && user.longitude
                    ? `${user.latitude.toFixed(2)}, ${user.longitude.toFixed(2)}`
                    : 'N/A'}
                </div>
                <div className="col-timezone">{user.timezone || 'N/A'}</div>
                <div className="col-actions">
                  <button onClick={() => handleEdit(user)} className="btn-icon btn-edit" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="btn-icon btn-delete" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={handleCloseModal} className="btn-close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">
                  Name *
                  <span className="field-hint">
                    (minimum 2 characters)
                  </span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., John Doe"
                  className={errors.name ? 'error' : ''}
                  autoComplete="name"
                />
                {errors.name && <span className="error-message">⚠️ {errors.name}</span>}
                {!errors.name && formData.name && formData.name.length >= 2 && (
                  <span className="success-message">✓ Valid name</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="zip">
                  ZIP Code *
                  <span className="field-hint">
                    (5-digit US ZIP code)
                  </span>
                </label>
                <input
                  id="zip"
                  type="text"
                  value={formData.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                  placeholder="e.g., 10001 or 90210"
                  maxLength="5"
                  className={errors.zip ? 'error' : ''}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  pattern="\d{5}"
                />
                {errors.zip && <span className="error-message">⚠️ {errors.zip}</span>}
                {!errors.zip && formData.zip && /^\d{5}$/.test(formData.zip) && (
                  <span className="success-message">✓ Valid ZIP code</span>
                )}
              </div>

              {errors.submit && (
                <div className="error-message submit-error">{errors.submit}</div>
              )}

              <div className="modal-footer">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
