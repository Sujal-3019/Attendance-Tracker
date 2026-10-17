
import { useEffect, useMemo, useState } from "react";
import { Plus, Wallet, X } from "lucide-react";
import AppShell from "@/app/layouts/AppShell";
import { Button } from "@/components/ui/button";
import {
    getSalaryAdvances,
    createSalaryAdvance,
    settleSalaryAdvance,
} from "../services/salaryAdvanceService";
import { getPayrollEmployees } from "../services/payrollService";

export default function SalaryAdvancesPage() {
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [employees, setEmployees] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        employeeId: "",
        amount: "",
        monthlyDeduction: "",
        startMonth: new Date().toISOString().slice(0, 7),
        notes: "",
    });

    const activeEmployees = useMemo(
        () => employees.filter((employee) => employee.status !== "Inactive"),
        [employees],
    );

    async function loadAdvances() {
        try {
            setError("");
            setLoading(true);

            const [data, employeeData] = await Promise.all([
                getSalaryAdvances(),
                getPayrollEmployees(),
            ]);

            setAdvances(data);
            setEmployees(employeeData);
        } catch (err) {
            setError(err.message || "Failed to load salary advances.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAdvances();
    }, []);

    async function handleIssueAdvance(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        const amount = Number(form.amount);
        const monthlyDeduction = Number(form.monthlyDeduction);

        if (!form.employeeId) {
            setError("Please select an employee.");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Advance amount must be greater than zero.");
            return;
        }

        if (
            !Number.isFinite(monthlyDeduction) ||
            monthlyDeduction <= 0 ||
            monthlyDeduction > amount
        ) {
            setError(
                "Monthly deduction must be greater than zero and cannot exceed the advance amount.",
            );
            return;
        }

        try {
            setSaving(true);

            const selectedEmployee = employees.find(
                (employee) => employee.employeeId === form.employeeId,
            );

            if (!selectedEmployee) {
                throw new Error("Please select a valid employee.");
            }

            await createSalaryAdvance({
                employeeId: selectedEmployee.employeeId,
                employeeCode: selectedEmployee.employeeCode,
                employeeName: selectedEmployee.name,
                department: selectedEmployee.department,
                originalAmount: amount,
                monthlyDeduction,
                startMonth: form.startMonth,
                reason: form.notes.trim(),
            });

            await loadAdvances();

            setForm({
                employeeId: "",
                amount: "",
                monthlyDeduction: "",
                startMonth: new Date().toISOString().slice(0, 7),
                notes: "",
            });

            setShowForm(false);
            setSuccess("Salary advance issued successfully.");
        } catch (err) {
            setError(err.message || "Unable to issue salary advance.");
        } finally {
            setSaving(false);
        }
    }

    async function handleSettleAdvance(advance) {
        const confirmed = window.confirm(
            `Mark ${advance.employeeName}'s salary advance as fully settled? ` +
            `The remaining balance of ₹${advance.outstandingBalance.toLocaleString("en-IN")} ` +
            `will be recorded as a manual repayment.`,
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await settleSalaryAdvance(advance.id);
            await loadAdvances();

            setSuccess(
                `Salary advance for ${advance.employeeName} marked as settled.`,
            );
        } catch (err) {
            setError(err.message || "Failed to settle salary advance.");
        }
    }
    return (
        <AppShell>
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Salary Advances
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Issue employee advances and manage repayments.
                        </p>
                    </div>

                    <Button
                        onClick={() => {
                            setError("");
                            setSuccess("");
                            setShowForm(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Issue Advance
                    </Button>
                </div>

                {showForm && (
                    <form
                        onSubmit={handleIssueAdvance}
                        className="space-y-5 rounded-xl border bg-card p-5 sm:p-6"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold">Issue Salary Advance</h2>
                                <p className="text-sm text-muted-foreground">
                                    Set the advance amount and repayment terms.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowForm(false)}
                                aria-label="Close form"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="advance-employee" className="text-sm font-medium">
                                    Employee
                                </label>
                                <select
                                    id="advance-employee"
                                    required
                                    value={form.employeeId}
                                    onChange={(event) =>
                                        setForm({ ...form, employeeId: event.target.value })
                                    }
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="">Select employee</option>
                                    {activeEmployees.map((employee) => (
                                        <option key={employee.employeeId} value={employee.employeeId}>
                                            {employee.name} ({employee.employeeId})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="advance-amount" className="text-sm font-medium">
                                    Advance Amount (₹)
                                </label>
                                <input
                                    id="advance-amount"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    required
                                    value={form.amount}
                                    onChange={(event) =>
                                        setForm({ ...form, amount: event.target.value })
                                    }
                                    placeholder="e.g. 20000"
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="advance-deduction" className="text-sm font-medium">
                                    Monthly Deduction (₹)
                                </label>
                                <input
                                    id="advance-deduction"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    required
                                    value={form.monthlyDeduction}
                                    onChange={(event) =>
                                        setForm({ ...form, monthlyDeduction: event.target.value })
                                    }
                                    placeholder="e.g. 2000"
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="advance-start-month" className="text-sm font-medium">
                                    First Deduction Month
                                </label>
                                <input
                                    id="advance-start-month"
                                    type="month"
                                    required
                                    value={form.startMonth}
                                    onChange={(event) =>
                                        setForm({ ...form, startMonth: event.target.value })
                                    }
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <label htmlFor="advance-notes" className="text-sm font-medium">
                                    Notes (optional)
                                </label>
                                <textarea
                                    id="advance-notes"
                                    rows={3}
                                    value={form.notes}
                                    onChange={(event) =>
                                        setForm({ ...form, notes: event.target.value })
                                    }
                                    placeholder="Reason for advance or additional terms"
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        {Number(form.amount) > 0 && Number(form.monthlyDeduction) > 0 && (
                            <p className="text-sm text-muted-foreground">
                                Estimated repayment duration:{" "}
                                {Math.ceil(Number(form.amount) / Number(form.monthlyDeduction))} month(s)
                            </p>
                        )}

                        <div className="flex flex-wrap justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? "Issuing..." : "Issue Advance"}
                            </Button>
                        </div>
                    </form>
                )}


                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                {success && (
                    <p className="text-sm text-green-700 dark:text-green-400">
                        {success}
                    </p>
                )}

                <div className="rounded-xl border bg-card">
                    <div className="flex items-center gap-3 border-b p-5">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h2 className="font-medium">Advance Records</h2>
                            <p className="text-sm text-muted-foreground">
                                {advances.length} advance records
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <p className="p-6 text-sm text-muted-foreground">
                            Loading advances...
                        </p>
                    ) : advances.length === 0 ? (
                        <p className="p-6 text-sm text-muted-foreground">
                            No salary advances found.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/40 text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Employee</th>
                                        <th className="px-5 py-3 font-medium">Advance</th>
                                        <th className="px-5 py-3 font-medium">Outstanding</th>
                                        <th className="px-5 py-3 font-medium">Monthly Deduction</th>
                                        <th className="px-5 py-3 font-medium">Start Month</th>
                                        <th className="px-5 py-3 font-medium">Status</th>
                                        <th className="px-5 py-3 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {advances.map((advance) => (
                                        <tr key={advance.id}>
                                            <td className="px-5 py-4">
                                                <p className="font-medium">{advance.employeeName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {advance.employeeCode}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                ₹{Number(advance.originalAmount).toLocaleString("en-IN")}
                                            </td>
                                            <td className="px-5 py-4 font-medium">
                                                ₹{Number(advance.outstandingBalance).toLocaleString("en-IN")}
                                            </td>
                                            <td className="px-5 py-4">
                                                ₹{Number(advance.monthlyDeduction).toLocaleString("en-IN")}
                                            </td>
                                            <td className="px-5 py-4">{advance.startMonth}</td>
                                            <td className="px-5 py-4">{advance.status}</td>
                                            <td className="px-4 py-3 text-right">
                                                {advance.outstandingBalance > 0 ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSettleAdvance(advance)}
                                                    >
                                                        Mark as Settled
                                                    </Button>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        Settled
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
