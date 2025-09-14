'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from "react-hot-toast";
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import bcrypt from 'bcryptjs';
// import bcrypt from 'bcryptjs';
import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';

import InputField from '@/components/InputField';
import Button from '@/components/button';
import prisma from '@/lib/db/prisma';

const FormSchema = z
  .object({
    // firstName: z
    //   .string()
    //   .min(2, 'First name must be atleast 2 characters')
    //   .max(100, 'First name must be less than 45 characters')
    //   .regex(new RegExp('^[a-zA-Z]+$'), 'No special character allowed!'),
    // lastName: z
    //   .string()
    //   .min(0, 'Last name must be atleast 2 characters')
    //   .max(100, 'Last name must be less than 45 characters')
    //   .regex(new RegExp('^[a-zA-Z]+$'), 'No special character allowed!'),
    firstName: z
        .string()
        .trim()
        .min(2, 'First name must be at least 2 characters')
        .max(70, 'First name must be less than 70 characters')
        .regex(/^[A-Za-z]+(?:\s[A-Za-z]+)*$/, 'No special character allowed!'),

    lastName: z
      .string()
        .trim()
        .max(100, 'Last name must be less than 100 characters')
        .regex(/^[A-Za-z]+(?:\s[A-Za-z]+)*$/, 'No special character allowed!')
        .optional()
        .or(z.literal('')),

    email: z
      .string()
      .email('Please enter a valid email address')
      .endsWith('@am.students.amrita.edu', 'Must be an Amrita student email (@am.students.amrita.edu)'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters ')
      .max(50, 'Password must be less than 50 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters ')
      .max(50, 'Password must be less than 50 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password doesn't match!",
    path: ['confirmPassword'],
  });

type InputType = z.infer<typeof FormSchema>;

const RegisterForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InputType>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = async (formData: InputType) => {
    try {
      setIsLoading(true);
      console.log('Attempting registration with:', formData.firstName, formData.email, formData.email.split('@')[0].toUpperCase());

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          rollno: formData.email.split('@')[0].toUpperCase(), // Assuming roll number is the part before '@'
          password: formData.password,
          role: 'STUDENT'
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast.success('Registration successful!');

      // Try to sign in immediately after registration
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        console.error('Sign in error after registration:', signInResult.error);
        throw new Error('Failed to sign in after registration');
      }

      router.push('/dashboard/student');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      });

      if (result?.error) {
        toast.error('Google sign in failed');
        return;
      }

      if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in with Google');
    }
  };

  return (
    <div className="w-full bg-white rounded-lg md:mt-0 sm:max-w-md min-w-[330px] md:min-w-[400px] xl:p-0 shadow-lg border">
      <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
        <h1 className="text-xl font-bold leading-tight text-left tracking-tight text-gray-900 md:text-2xl">
          Create Student Account
        </h1>

        {/* Google Sign In Button */}
        {/* <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          <FcGoogle className="w-5 h-5" />
          <span>Continue with Google</span>
        </button> */}
{/* 
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div> */}

        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900">
                First Name
              </label>
              <input
                {...register('firstName')}
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                placeholder="First name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-900">
                Last Name
              </label>
              <input
                {...register('lastName')}
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                placeholder="Last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900">
              Student Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
              placeholder="name@am.students.amrita.edu"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-900">
              Confirm Password
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:outline-none focus:ring-primary-light font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-sm font-light text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/student/signin" className="font-medium text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
