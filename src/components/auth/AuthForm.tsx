import { useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { authAPI } from '@/utils/API.ts';
import { Goal } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';


interface AuthFormProps {
    onAuthSuccess: () => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            await authAPI.signin(email, password);
            onAuthSuccess();
        } catch (err: any) {
            console.error('Sign in error:', err);
            setError(err.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;
        const role = formData.get('role') as 'admin' | 'operator';
        const operatorName = formData.get('operatorName') as string;

        try {
            await authAPI.signup(email, password, name, role, operatorName);
            // Auto sign in after signup
            await authAPI.signin(email, password);
            onAuthSuccess();
        } catch (err: any) {
            console.error('Sign up error:', err);
            setError(err.message || 'Failed to sign up');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md space-y-4">
                <Card>
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Goal className="size-12 text-indigo-600" />
                        </div>
                        <CardTitle>Gaming Operator Reporting & Analysis System</CardTitle>
                        <CardDescription>Secure unified reporting and analytics platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="signin">
                            <TabsContent value="signin">
                                <form onSubmit={handleSignIn} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signin-email">Email</Label>
                                        <Input
                                            id="signin-email"
                                            name="email"
                                            type="email"
                                            placeholder="operator@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 relative">
                                        <Label htmlFor="signin-password">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="signin-password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-2 flex items-center justify-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    {error && (
                                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                                            {error}
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? 'Signing in...' : 'Sign In'}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}