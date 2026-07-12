import React, { useEffect, useState } from 'react';
import { Users, Plus, User, ShieldAlert } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'PROCUREMENT_OFFICER',
    departmentId: '',
  });

  const fetchData = async () => {
    try {
      const [empRes, deptsRes] = await Promise.all([
        apiClient.get('/employees'),
        apiClient.get('/departments'),
      ]);

      if (empRes.data.success) setEmployees(empRes.data.data);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
    } catch (err) {
      toast.error('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/employees', formData);
      if (response.data.success) {
        toast.success('Employee registered successfully!');
        setIsModalOpen(false);
        setFormData({
          name: '',
          email: '',
          role: 'PROCUREMENT_OFFICER',
          departmentId: '',
        });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register employee.');
      setLoading(false);
    }
  };

  const formatRole = (role) => {
    if (!role) return '';
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center gap-3">
          <Users className="h-8 w-8" />
          Employees
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <ShieldAlert className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Employees Registered</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Get started by registering a new organization employee.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-800 dark:text-slate-200">
                  <td className="px-6 py-4 font-bold flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center font-bold text-xs">
                      {(employee.firstName?.[0] || 'E') + (employee.lastName?.[0] || '')}
                    </div>
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td className="px-6 py-4">{employee.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800">
                      {formatRole(employee.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {employee.departments?.[0]?.name || employee.department?.name || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Add New Employee
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer font-bold text-sm">
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name *</label>
                <input type="text" name="name" placeholder="e.g. Priyesh Patel" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address *</label>
                <input type="email" name="email" placeholder="e.g. patel@company.com" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Role *</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required>
                  <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Department</label>
                <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
