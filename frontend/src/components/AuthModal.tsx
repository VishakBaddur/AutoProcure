"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/utils/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: any) => void;
  mode: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, mode }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let data;
      if (mode === 'login') {
        data = await api.login({ email, password });
      } else {
        data = await api.signup({ email, password, name });
      }

      if (data.access_token || data.user_id) {
        if (mode === 'login') {
          onAuthSuccess(data.access_token, { id: data.user_id, email });
        } else {
          // For signup, show success message and switch to login
          alert('Account created successfully! Please log in.');
          onClose();
        }
      } else {
        // Handle different error response formats
        let errorMessage = 'Authentication failed';
        
        if (data.detail) {
          errorMessage = typeof data.detail === 'string' 
            ? data.detail 
            : 'Invalid request data';
        } else if (data.error) {
          errorMessage = typeof data.error === 'string' 
            ? data.error 
            : 'Authentication error';
        } else if (data.message) {
          errorMessage = typeof data.message === 'string' 
            ? data.message 
            : 'Request failed';
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === 'login' ? 'Login' : 'Sign Up'}</CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Enter your credentials to access AutoProcure'
              : 'Create a new account to get started'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required={mode === 'signup'}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Loading...' : (mode === 'login' ? 'Login' : 'Sign Up')}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 