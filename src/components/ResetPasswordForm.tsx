'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordStrength } from 'check-password-strength';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import toast from "react-hot-toast";


import { resetPassword } from '@/lib/actions/authActions';

interface Props {
  jwtUserId: string;
}

const FormSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters!')
      .max(52, 'Password must be less than 52 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password does not match!',
    path: ['confirmPassword'],
  });

type InputType = z.infer<typeof FormSchema>;

const ResetPasswordForm = ({ jwtUserId }: Props) => {
  const [visiblePass, setVisiblePass] = useState(false);
  const [passStrength, setPassStrength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InputType>({
    resolver: zodResolver(FormSchema),
  });
  useEffect(() => {
    setPassStrength(passwordStrength(watch().password).id);
  }, [watch().password]);

  const resetPass: SubmitHandler<InputType> = async (data) => {
    try {
      const result = await resetPassword(jwtUserId, data.password);
      if(result === 'success')
        toast.success('Your password has been reset successfully!');
    } catch (err) {
      toast.error('Something went wrong!');
      console.error(err);
    }
  };
  return (
      <div>
          Contact your administrator to reset your password.
      </div>
  );
  // return (
  //     <form
  //         onSubmit={handleSubmit(resetPass)}
  //         className="flex flex-col gap-2 p-2 m-2 border rounded-md shadow"
  //     >
  //         <div className="text-center p-2">Reset Your Password</div>
  //         <Input
  //             type={visiblePass ? 'text' : 'password'}
  //             // label="Password"
  //             //{...register('password')}
  //             // errorMessage={errors.password?.message}
  //             endContent={
  //                 <button type="button" onClick={() => setVisiblePass((prev) => !prev)}>
  //                     {visiblePass ? (
  //                         <EyeSlashIcon className="w-4" />
  //                     ) : (
  //                         <EyeIcon className="w-4" />
  //                     )}
  //                 </button>
  //       }
  //         />
  //         <PasswordStrength passStrength={passStrength} />
  //         <Input
  //             type={visiblePass ? 'text' : 'password'}
  //             label="Confirm Password"
  //             // {...register('confirmPassword')}
  //             // errorMessage={errors.confirmPassword?.message}
  //         />
  //         <div className="flex justify-center">
  //             <Button
  //                 isLoading={isSubmitting}
  //                 type="submit"
  //                 isDisabled={isSubmitting}
  //                 variant="primary"
  //             >
  //                 {isSubmitting ? 'Please Wait...' : 'Submit'}
  //             </Button>
  //         </div>
  //     </form>
  // );
};

export default ResetPasswordForm;
