import {
  Eye,
  MoreHorizontal,
  Pencil,
  UserCheck,
  UserX,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusClasses(status) {
  if (status === "Active") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }

  return "bg-muted text-muted-foreground";
}

function getWorkModeClasses(workMode) {
  if (workMode === "Remote") {
    return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
  }

  if (workMode === "Hybrid") {
    return "bg-violet-500/10 text-violet-700 dark:text-violet-400";
  }

  return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
}

function EmployeeTable({ employees }) {
  if (employees.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-16 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted">
          <Eye className="size-5 text-muted-foreground" />
        </div>

        <h3 className="mt-4 text-sm font-semibold">No employees found</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Try changing your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/55 shadow-sm backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-245 text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left">
              <th className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                Employee
              </th>

              <th className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                Department
              </th>

              <th className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                Work mode
              </th>

              <th className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                Attendance
              </th>

              <th className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                Status
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/50">
            {employees.map((employee) => {
              const isActive = employee.status === "Active";

              return (
                <tr
                  key={employee.id}
                  className="transition-colors hover:bg-muted/35"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                        {getInitials(employee.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium">{employee.name}</p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {employee.designation}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium">{employee.department}</p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {employee.employmentType}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getWorkModeClasses(
                        employee.workMode,
                      )}`}
                    >
                      {employee.workMode}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {employee.attendance.present} present
                      </span>

                      <span className="text-muted-foreground">·</span>

                      <span className="text-muted-foreground">
                        {employee.attendance.late} late
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                        employee.status,
                      )}`}
                    >
                      {employee.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* View */}
                      <Link
                        to={`/employees/${employee.id}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`View ${employee.name}`}
                      >
                        <Eye className="size-4" />
                      </Link>

                      {/* Edit */}
                      <Link
                        to={`/employees/${employee.id}/edit`}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Edit ${employee.name}`}
                      >
                        <Pencil className="size-4" />
                      </Link>

                      {/* More */}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              type="button"
                              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label={`More actions for ${employee.name}`}
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            render={
                              <Link to={`/employees/${employee.id}`} />
                            }
                          >
                            <Eye className="size-4" />
                            View employee
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            render={
                              <Link
                                to={`/employees/${employee.id}/edit`}
                              />
                            }
                          >
                            <Pencil className="size-4" />
                            Edit employee
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            variant={isActive ? "destructive" : "default"}
                            onClick={() => {
                              // Status confirmation will be connected
                              // in the next step.
                              console.log(
                                `${isActive ? "Deactivate" : "Activate"} ${
                                  employee.name
                                }`,
                              );
                            }}
                          >
                            {isActive ? (
                              <UserX className="size-4" />
                            ) : (
                              <UserCheck className="size-4" />
                            )}

                            {isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeTable;