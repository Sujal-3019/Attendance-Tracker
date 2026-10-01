import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RegistrationSuccess from "./RegistrationSuccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    adminRegisterSchema,
    organizationTypes,
} from "../schemas/authSchemas";
import { registerAdmin } from "../services/authService";

function AdminRegisterForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [registrationResult, setRegistrationResult] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(adminRegisterSchema),
        defaultValues: {
            organizationName: "",
            organizationType: "",
            fullName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data) => { 
        setSubmitError(""); 
        try { 
            const result = await registerAdmin(data); 
            setRegistrationResult(result); 
        } catch (error) { 
            console.error("Admin registration failed:", error); 
            setSubmitError( "We couldn't create your account right now. Please try again.", ); 
        } 
    };

    if (registrationResult?.success) { 
        return ( 
        <RegistrationSuccess organizationName={
            registrationResult.organization.name
        } 
        /> 
    ); 
    }

    return (
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            {/* Organization */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-sm font-semibold">Organization details</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Tell us a little about your organization.
                    </p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="organizationName" className="text-sm font-medium">
                        Organization name
                    </label>

                    <Input
                        id="organizationName"
                        placeholder="e.g. Acme Technologies"
                        autoComplete="organization"
                        {...register("organizationName")}
                    />

                    {errors.organizationName && (
                        <p className="text-xs text-destructive">
                            {errors.organizationName.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="organizationType" className="text-sm font-medium">
                        Organization type
                    </label>

                    <select
                        id="organizationType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                        {...register("organizationType")}
                    >
                        <option value="">Select organization type</option>

                        {organizationTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>

                    {errors.organizationType && (
                        <p className="text-xs text-destructive">
                            {errors.organizationType.message}
                        </p>
                    )}
                </div>
            </section>

            {/* Administrator */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-sm font-semibold">Administrator account</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        These details will be used to manage your organization.
                    </p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium">
                        Full name
                    </label>

                    <Input
                        id="fullName"
                        placeholder="Your full name"
                        autoComplete="name"
                        {...register("fullName")}
                    />

                    {errors.fullName && (
                        <p className="text-xs text-destructive">
                            {errors.fullName.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                        Email address
                    </label>

                    <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        {...register("email")}
                    />

                    {errors.email && (
                        <p className="text-xs text-destructive">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                        Mobile number
                    </label>

                    <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        autoComplete="tel"
                        {...register("phone")}
                    />

                    {errors.phone && (
                        <p className="text-xs text-destructive">
                            {errors.phone.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                        Password
                    </label>

                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            autoComplete="new-password"
                            className="pr-10"
                            {...register("password")}
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword((current) => !current)}
                            className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
                        >
                            {showPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    </div>

                    {errors.password && (
                        <p className="text-xs text-destructive">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirm password
                    </label>

                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            className="pr-10"
                            {...register("confirmPassword")}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword((current) => !current)
                            }
                            className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={
                                showConfirmPassword
                                    ? "Hide confirm password"
                                    : "Show confirm password"
                            }
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    </div>

                    {errors.confirmPassword && (
                        <p className="text-xs text-destructive">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>
            </section>

            {submitError && (
                <div
                    role="alert"
                    className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                    {submitError}
                </div>
            )}

            <div className="space-y-3">
                <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full rounded-xl"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            Creating organization...
                        </>
                    ) : (
                        "Create organization"
                    )}
                </Button>

                <p className="text-center text-[11px] leading-5 text-muted-foreground">
                    By creating an account, you agree to your organization's
                    attendance and workforce management policies.
                </p>
            </div>
        </form>
    );
}

export default AdminRegisterForm;
