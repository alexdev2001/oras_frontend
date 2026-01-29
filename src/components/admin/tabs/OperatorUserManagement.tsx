import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Globe, UserPlus, Plus, Mail, Shield, Calendar, CheckCircle, XCircle, Edit, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Alert, AlertDescription } from '../../ui/alert';
import { managementAPI } from "@/utils/API.ts";
import type {Regulator} from "@/types/regulator.ts";

export interface Operator {
    operator_id: number;
    operator_name: string;
    license_number: string;
    users?: User[];
}

interface User {
    user_id: number;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
    operator_id?: number;
    regulator_id?: number;
    operator?: Operator;
    roles?: string[];
}

export function OperatorUserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [regulators, setRegulators] = useState<Regulator[]>([]);
    const [showRegulatorDialog, setShowRegulatorDialog] = useState(false);
    const [editingRegulator, setEditingRegulator] = useState<Regulator | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [regulatorDeleteDialogOpen, setRegulatorDeleteDialogOpen] = useState(false);
    const [regulatorToDelete, setRegulatorToDelete] = useState<Regulator | null>(null);


    const [regulatorForm, setRegulatorForm] = useState({
        regulator_name: '',
        country: ''
    });

    // User form state
    const [userForm, setUserForm] = useState({
        email: '',
        full_name: '',
        password: '',
        confirm_password: '',
        operator_id: null as number | null,
        regulator_id: null as number | null,
        roles: ['operator'],
    });

    // Password visibility states
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password validation
    const getPasswordValidation = (password: string) => {
        if (!password) return { isValid: false, message: '' };
        
        // Simple validation - just check if password is not empty
        const isValid = password.length > 0;
        
        if (!isValid) {
            return {
                isValid: false,
                message: 'Password is required'
            };
        }
        
        return { isValid: true, message: 'Password set' };
    };

    const getConfirmPasswordValidation = (password: string, confirmPassword: string) => {
        if (!confirmPassword) return { isValid: false, message: '' };
        
        if (password !== confirmPassword) {
            return { isValid: false, message: 'Passwords do not match' };
        }
        
        return { isValid: true, message: 'Passwords match' };
    };

    const handleRegulatorChange = (value: string) => {
        if (value === 'none') {
            setUserForm((prev) => ({
                ...prev,
                regulator_id: null,
                roles: ['admin'],
            }));
            return;
        }

        const regulatorId = Number(value);

        setUserForm((prev) => ({
            ...prev,
            regulator_id: regulatorId,
            roles: ['regulator'],
        }));
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, regulatorsData] = await Promise.all([
                managementAPI.getUsers(),
                managementAPI.getRegulators()
            ]);
            setUsers((usersData || []).filter(u => u && u.user_id));
            setRegulators((regulatorsData || []).filter(r => r && r.regulator_id));
        } catch (err: any) {
            console.error('Failed to load data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };


    const openEditUserDialog = (user: User) => {
        setEditingUser(user);

        setUserForm({
            email: user.email,
            full_name: user.full_name,
            password: '',
            confirm_password: '',
            operator_id: null,
            regulator_id: user.regulator_id ?? null,
            roles: user.regulator_id ? ['regulator'] : ['admin'],
        });

        setShowUserDialog(true);
    };

    const closeUserDialog = () => {
        setShowUserDialog(false);
        setEditingUser(null);
        setUserForm({
            email: '',
            full_name: '',
            password: '',
            confirm_password: '',
            operator_id: null,
            regulator_id: null,
            roles: ['admin']
        });
    };


    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate passwords match
        if (userForm.password !== userForm.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        // Validate password is not empty
        if (!userForm.password) {
            setError('Password is required');
            return;
        }

        try {
            const userData = {
                email: userForm.email,
                full_name: userForm.full_name,
                password: userForm.password,
                operator_id: null,
                regulator_id: userForm.regulator_id ? parseInt(userForm.regulator_id.toString()) : null,
                roles: userForm.roles
            };

            await managementAPI.createUser(userData);

            setSuccess('User created successfully!');
            setUserForm({
                email: '',
                full_name: '',
                password: '',
                confirm_password: '',
                operator_id: null,
                regulator_id: null,
                roles: ['operator']
            });

            setShowUserDialog(false);
            loadData();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to create user');
        }
    };



    const handleCreateRegulator = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await managementAPI.createRegulator(regulatorForm);
            setSuccess('Regulator created successfully!');
            setRegulatorForm({ regulator_name: '', country: '' });
            setShowRegulatorDialog(false);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to create regulator');
        }
    };

    const handleUpdateRegulator = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRegulator) return;

        setError('');
        setSuccess('');

        try {
            await managementAPI.updateRegulator(editingRegulator.regulator_id, regulatorForm);
            setSuccess('Regulator updated successfully!');
            setEditingRegulator(null);
            setShowRegulatorDialog(false);
            setRegulatorForm({ regulator_name: '', country: '' });
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update regulator');
        }
    };

    const openRegulatorDialog = (regulator?: Regulator) => {
        if (regulator) {
            setEditingRegulator(regulator);
            setRegulatorForm({
                regulator_name: regulator.regulator_name,
                country: regulator.country
            });
        } else {
            setEditingRegulator(null);
            setRegulatorForm({ regulator_name: '', country: '' });
        }
        setShowRegulatorDialog(true);
    };


    const handleDeleteRegulator = async (regulatorId: number) => {
        const regulator = regulators.find(r => r.regulator_id === regulatorId);
        if (regulator) {
            setRegulatorToDelete(regulator);
            setRegulatorDeleteDialogOpen(true);
        }
    };

    const confirmDeleteRegulator = async () => {
        if (!regulatorToDelete) return;

        try {
            await managementAPI.deleteRegulator(regulatorToDelete.regulator_id);
            setSuccess('Regulator deleted successfully!');
            setRegulatorDeleteDialogOpen(false);
            setRegulatorToDelete(null);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to delete regulator');
        }
    };

    const cancelDeleteRegulator = () => {
        setRegulatorDeleteDialogOpen(false);
        setRegulatorToDelete(null);
    };

    const handleDeleteUser = async (userId: number) => {
        const user = users.find(u => u.user_id === userId);
        if (user) {
            setUserToDelete(user);
            setDeleteDialogOpen(true);
        }
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            await managementAPI.deleteUser(userToDelete.user_id);
            setSuccess('User deleted successfully!');
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to delete user');
        }
    };

    const cancelDeleteUser = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setError('');
        setSuccess('');

        // Validate passwords match if password is provided
        if (userForm.password && userForm.password !== userForm.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        try {
            const userData = {
                ...userForm,
                operator_id: null
            };

            await managementAPI.updateUser(editingUser.user_id, userData);

            setSuccess('User updated successfully!');

            setUserForm({
                email: '',
                full_name: '',
                password: '',
                confirm_password: '',
                operator_id: null,
                regulator_id: null,
                roles: ['operator']
            });

            setEditingUser(null);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update user');
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading user management...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Success/Error Messages */}
            {success && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="size-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <XCircle className="size-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Users</p>
                                <p className="text-3xl font-semibold mt-1">{users.length}</p>
                            </div>
                            <div className="size-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <UserPlus className="size-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Regulators</p>
                                <p className="text-3xl font-semibold mt-1">
                                    {regulators.length}
                                </p>
                            </div>

                            <div className="size-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Globe className="size-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/*Regulators section*/}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="size-5 text-indigo-600" />
                                Regulators
                            </CardTitle>
                            <CardDescription>Manage regulatory bodies and their information</CardDescription>
                        </div>
                        <Button onClick={() => openRegulatorDialog()}>
                            <Plus className="size-4 mr-2" />
                            Add Regulator
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {regulators.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Globe className="size-12 mx-auto mb-4 text-gray-400" />
                            <p className="mb-4">No regulators found</p>
                            <Button onClick={() => openRegulatorDialog()}>
                                <Plus className="size-4 mr-2" />
                                Add Your First Regulator
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {regulators.map((regulator) => (
                                <div
                                    key={regulator.regulator_id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Globe className="size-5 text-indigo-600" />
                                                <h3 className="font-medium">{regulator.regulator_name}</h3>
                                                <Badge variant="outline">{regulator.country}</Badge>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="size-4" />
                                                    <span>Created {regulator.created_at ? new Date(regulator.created_at).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openRegulatorDialog(regulator)}
                                            >
                                                <Edit className="size-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteRegulator(regulator.regulator_id)}
                                            >
                                                <Trash2 className="size-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>


            {/* Users Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="size-5" />
                                Users
                            </CardTitle>
                            <CardDescription>Manage user accounts and permissions</CardDescription>
                        </div>
                        <Button onClick={() => setShowUserDialog(true)}>
                            <Plus className="size-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">ID</th>
                                <th className="text-left py-3 px-4">User</th>
                                <th className="text-left py-3 px-4">Regulator</th>
                                <th className="text-left py-3 px-4">Role</th>
                                <th className="text-left py-3 px-4">Status</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        No users found. Add your first user to get started.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const userRegulator = regulators.find(
                                        reg => reg.regulator_id === user.regulator_id
                                    );

                                    const displayName = userRegulator?.regulator_name || 'No regulator';
                                    const DisplayIcon = Globe;

                                    return (
                                        <tr key={user.user_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="py-3 px-4 font-medium">#{user.user_id}</td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="size-4 text-gray-400" />
                                                        <span className="font-medium">{user.full_name || 'N/A'}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 ml-6">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <DisplayIcon className="size-4 text-indigo-600" />
                                                    <span className="text-sm">{displayName}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                                    <Shield className="size-3" />
                                                    {typeof user.roles?.[0] === 'string' ? user.roles[0] : (user.roles?.[0] as any)?.name || 'admin'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                {user.is_active ? (
                                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                        <CheckCircle className="size-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                                        <XCircle className="size-3 mr-1" />
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => handleDeleteUser(user.user_id)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => openEditUserDialog(user)}>
                                                        <Edit className="size-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Regulator Dialog */}
            <Dialog open={showRegulatorDialog} onOpenChange={setShowRegulatorDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRegulator ? 'Edit Regulator' : 'Add New Regulator'}</DialogTitle>
                        <DialogDescription>
                            {editingRegulator ? 'Update regulator information' : 'Create a new regulatory body'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={editingRegulator ? handleUpdateRegulator : handleCreateRegulator} className="space-y-4">
                        <div>
                            <Label htmlFor="regulator_name">Regulator Name *</Label>
                            <Input
                                id="regulator_name"
                                value={regulatorForm.regulator_name}
                                onChange={(e) => setRegulatorForm({ ...regulatorForm, regulator_name: e.target.value })}
                                placeholder="e.g., Gaming Control Board"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="country">Country of Origin *</Label>
                            <Input
                                id="country"
                                value={regulatorForm.country}
                                onChange={(e) => setRegulatorForm({ ...regulatorForm, country: e.target.value })}
                                placeholder="e.g., United States"
                                required
                            />
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button type="submit">
                                {editingRegulator ? 'Update Regulator' : 'Create Regulator'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowRegulatorDialog(false);
                                    setEditingRegulator(null);
                                    setRegulatorForm({ regulator_name: '', country: '' });
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>



            {/* Add User Dialog */}
            {/* User Dialog */}
            <Dialog
                open={showUserDialog || !!editingUser}
                onOpenChange={(open) => !open && closeUserDialog()}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="size-5 text-indigo-600" />
                            {editingUser ? 'Edit User' : 'Add New User'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? 'Update user account details and assignments'
                                : 'Create a new user account and assign regulator/operator'}
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                        className="space-y-4"
                    >
                        {/* Email + Full Name */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={userForm.email}
                                    onChange={(e) =>
                                        setUserForm({ ...userForm, email: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name *</Label>
                                <Input
                                    id="full_name"
                                    placeholder="John Doe"
                                    value={userForm.full_name}
                                    onChange={(e) =>
                                        setUserForm({ ...userForm, full_name: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="space-y-4">
                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password{' '}
                                    {editingUser && (
                                        <span className="text-xs text-gray-500">
                                            (leave blank to keep current)
                                        </span>
                                    )}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={userForm.password}
                                        onChange={(e) =>
                                            setUserForm({ ...userForm, password: e.target.value })
                                        }
                                        required={!editingUser}
                                        className={`pr-10 ${
                                            userForm.password && getPasswordValidation(userForm.password).isValid
                                                ? 'border-green-500 focus:border-green-500'
                                                : userForm.password && !getPasswordValidation(userForm.password).isValid
                                                ? 'border-red-500 focus:border-red-500'
                                                : ''
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                                {userForm.password && (
                                    <div className={`text-xs flex items-center gap-1 ${
                                        getPasswordValidation(userForm.password).isValid
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                    }`}>
                                        <AlertCircle className="size-3" />
                                        {getPasswordValidation(userForm.password).message}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            {userForm.password && (
                                <div className="space-y-2">
                                    <Label htmlFor="confirm_password">Confirm Password *</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm_password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={userForm.confirm_password}
                                            onChange={(e) =>
                                                setUserForm({ ...userForm, confirm_password: e.target.value })
                                            }
                                            required={!!userForm.password}
                                            className={`pr-10 ${
                                                userForm.confirm_password && getConfirmPasswordValidation(userForm.password, userForm.confirm_password).isValid
                                                    ? 'border-green-500 focus:border-green-500'
                                                    : userForm.confirm_password && !getConfirmPasswordValidation(userForm.password, userForm.confirm_password).isValid
                                                    ? 'border-red-500 focus:border-red-500'
                                                    : ''
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                    {userForm.confirm_password && (
                                        <div className={`text-xs flex items-center gap-1 ${
                                            getConfirmPasswordValidation(userForm.password, userForm.confirm_password).isValid
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}>
                                            <AlertCircle className="size-3" />
                                            {getConfirmPasswordValidation(userForm.password, userForm.confirm_password).message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Regulator Assignment */}
                        <div className="space-y-2">
                            <Label htmlFor="regulator_id">Regulator *</Label>
                            <Select
                                value={userForm.regulator_id !== null
                                    ? String(userForm.regulator_id)
                                    : 'none'}
                                onValueChange={handleRegulatorChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select regulator..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No regulator</SelectItem>

                                    {regulators.map((reg) => (
                                        <SelectItem
                                            key={reg.regulator_id}
                                            value={String(reg.regulator_id)}
                                        >
                                            {reg.regulator_name} ({reg.country})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={userForm.roles[0]}
                                onValueChange={(value) =>
                                    setUserForm((prev) => ({
                                        ...prev,
                                        roles: [value],
                                        regulator_id: value === 'admin' ? null : prev.regulator_id,
                                    }))
                                }
                                disabled={userForm.regulator_id !== null}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="regulator" disabled>
                                        Regulator (auto-assigned when regulator is selected)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {userForm.regulator_id !== null && (
                                <p className="text-xs text-muted-foreground">
                                    Role is automatically set to "Regulator" when a regulator is assigned
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={closeUserDialog}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingUser ? (
                                    <>
                                        <Edit className="size-4 mr-2" />
                                        Update User
                                    </>
                                ) : (
                                    <>
                                        <Plus className="size-4 mr-2" />
                                        Create User
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete User Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="size-5" />
                            Delete User
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {userToDelete && (
                        <div className="py-4">
                            <div className="bg-background rounded-lg p-4 border">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <UserPlus className="size-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{userToDelete.full_name || 'N/A'}</p>
                                        <p className="text-sm text-muted-foreground">{userToDelete.email}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            ID: #{userToDelete.user_id} • Role: {typeof userToDelete.roles?.[0] === 'string' ? userToDelete.roles[0] : 'admin'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={cancelDeleteUser}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={confirmDeleteUser}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <Trash2 className="size-4 mr-2" />
                            Delete User
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>


            {/* Delete Regulator Confirmation Dialog */}
            <Dialog open={regulatorDeleteDialogOpen} onOpenChange={setRegulatorDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="size-5" />
                            Delete Regulator
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this regulator? This action cannot be undone and will affect all associated operators and users.
                        </DialogDescription>
                    </DialogHeader>
                    {regulatorToDelete && (
                        <div className="py-4">
                            <div className="bg-background rounded-lg p-4 border">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <Globe className="size-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{regulatorToDelete.regulator_name}</p>
                                        <p className="text-sm text-muted-foreground">Country: {regulatorToDelete.country}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            ID: #{regulatorToDelete.regulator_id} • 0 associated operators
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={cancelDeleteRegulator}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={confirmDeleteRegulator}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <Trash2 className="size-4 mr-2" />
                            Delete Regulator
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}