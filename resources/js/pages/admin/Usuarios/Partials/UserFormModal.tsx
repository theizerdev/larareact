import { Building2, CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldAlert, User as UserIcon } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { SoxPasswordRequirements } from '@/components/sox-password-requirements';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';
import PhoneInputGroup from '../../Empresas/Partials/PhoneInputGroup';
import {
    isPrivilegedRoleName
    
    
    
    
    
    
} from './types';
import type {Empresa, Pais, Role, Sucursal, UserFormState, UserItem} from './types';
import { UserAvatar } from './UserAvatar';

interface UserFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    auth: Auth;
    editingUser: UserItem | null;
    duplicatingUser: UserItem | null;
    roles: Role[];
    empresas: Empresa[];
    sucursales: Sucursal[];
    paises: Pais[];
    soxPolicies?: {
        minLength: number;
        historyLimit: number;
        expireDays: number;
    };
    data: UserFormState;
    setData: {
        <K extends keyof UserFormState>(key: K, value: UserFormState[K]): void;
        (updater: (previous: UserFormState) => UserFormState): void;
    };
    errors: Partial<Record<keyof UserFormState, string>>;
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export function UserFormModal({
    open,
    onOpenChange,
    auth,
    editingUser,
    duplicatingUser,
    roles,
    empresas,
    sucursales,
    paises,
    soxPolicies,
    data,
    setData,
    errors,
    processing,
    onSubmit,
}: UserFormModalProps) {
    const { __ } = useTranslate();
    const [showPassword, setShowPassword] = useState(false);

    const actorRoles = Array.isArray(auth?.user?.roles)
        ? (auth.user.roles as Array<{ name: string }>)
        : [];

    const isActorSuperAdmin =
        auth?.user?.is_super_admin === true ||
        actorRoles.some((r) => isPrivilegedRoleName(r.name));

    const filteredSucursales = useMemo(() => {
        if (!data.empresa_id) {
            return [];
        }

        return sucursales.filter((s) => s.empresa_id === Number(data.empresa_id));
    }, [data.empresa_id, sucursales]);

    const hasSuperAdminRoleSelected = useMemo(
        () => data.roles.some((r) => isPrivilegedRoleName(r)),
        [data.roles]
    );

    const handleRoleChange = (roleName: string, checked: boolean) => {
        if (checked) {
            setData('roles', [...data.roles, roleName]);
        } else {
            setData(
                'roles',
                data.roles.filter((r) => r !== roleName)
            );
        }
    };

    const previewName = data.name.trim() || 'Nuevo Usuario';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[820px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-950/95">
                <form onSubmit={onSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
                    {/* Header con gradiente + Avatar reactivo con iniciales */}
                    <div className="relative px-6 pt-5 pb-4 pr-12 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-indigo-500/8 via-sky-500/5 to-transparent shrink-0">
                        <div className="flex items-center gap-4">
                            <UserAvatar
                                name={previewName}
                                email={data.email}
                                status={data.status}
                                isLocked={editingUser?.is_locked}
                                isSuperAdmin={hasSuperAdminRoleSelected || editingUser?.is_super_admin}
                                size="lg"
                                showStatusDot
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        {editingUser
                                            ? __('Edit User')
                                            : duplicatingUser
                                              ? __('Duplicate User')
                                              : __('New User')}
                                    </DialogTitle>
                                    {data.name.trim() !== '' && (
                                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60 truncate max-w-[240px]">
                                            {data.name}
                                        </span>
                                    )}
                                </div>
                                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {duplicatingUser
                                        ? `${__('Duplicating user characteristics from')} ${duplicatingUser.name}. ${__('Please enter a new email and password.')}`
                                        : __('Complete user credentials, personal details and select roles.')}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    {/* Cuerpo scrolleable */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5 bg-slate-50/30 dark:bg-slate-950/30">
                        {/* Sección 1: Identidad y Credenciales */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Identidad y Credenciales
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nombre completo */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label htmlFor="user-name" className="text-xs font-semibold">
                                        {__('Full Name')} <span className="text-rose-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <UserIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <Input
                                            id="user-name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Ej: Juan Pérez"
                                            className="h-10 rounded-xl pl-9"
                                            required
                                        />
                                    </div>
                                    {errors.name && <p className="text-rose-500 text-xs font-medium">{errors.name}</p>}
                                </div>

                                {/* Usuario */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="user-username" className="text-xs font-semibold">
                                        {__('Username')}
                                    </Label>
                                    <Input
                                        id="user-username"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        placeholder="Ej: jperez"
                                        className="h-10 rounded-xl"
                                    />
                                    {errors.username && (
                                        <p className="text-rose-500 text-xs font-medium">{errors.username}</p>
                                    )}
                                </div>

                                {/* Correo */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="user-email" className="text-xs font-semibold">
                                        {__('Email')} <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="user-email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="jperez@empresa.com"
                                        className="h-10 rounded-xl"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-rose-500 text-xs font-medium">{errors.email}</p>
                                    )}
                                </div>

                                {/* Contraseña */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label htmlFor="user-password" className="text-xs font-semibold">
                                        {__('Password')}{' '}
                                        {editingUser ? (
                                            <span className="font-normal text-muted-foreground">
                                                ({__('Leave blank to keep current password')})
                                            </span>
                                        ) : (
                                            <span className="text-rose-500">*</span>
                                        )}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="user-password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="•••••••••••••••"
                                            className="h-10 rounded-xl pr-10"
                                            required={!editingUser}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                                            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-rose-500 text-xs font-medium">{errors.password}</p>
                                    )}

                                    {(!editingUser || data.password.length > 0) && (
                                        <div className="pt-1.5">
                                            <SoxPasswordRequirements
                                                password={data.password}
                                                minLength={soxPolicies?.minLength ?? 15}
                                                historyLimit={soxPolicies?.historyLimit ?? 8}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sección 2: Contacto y Organización */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Contacto y Organización
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Teléfono */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label htmlFor="user-telefono" className="text-xs font-semibold">
                                        {__('Phone')}
                                    </Label>
                                    <PhoneInputGroup
                                        paises={paises}
                                        selectedPaisId={data.pais_telefono_id}
                                        phoneValue={data.telefono}
                                        onPaisChange={(v) => setData('pais_telefono_id', v)}
                                        onPhoneChange={(v) => setData('telefono', v)}
                                        placeholder="000-0000000"
                                        error={errors.telefono}
                                    />
                                </div>

                                {/* Empresa */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="user-empresa" className="text-xs font-semibold">
                                        {__('Company')}
                                    </Label>
                                    <Select
                                        value={data.empresa_id ? String(data.empresa_id) : 'none'}
                                        onValueChange={(v) => {
                                            setData((prev) => ({
                                                ...prev,
                                                empresa_id: v === 'none' ? '' : v,
                                                sucursal_id: '',
                                            }));
                                        }}
                                    >
                                        <SelectTrigger id="user-empresa" className="h-10 w-full rounded-xl">
                                            <SelectValue placeholder={__('None')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{__('None')}</SelectItem>
                                            {empresas.map((e) => (
                                                <SelectItem key={e.id} value={String(e.id)}>
                                                    {e.razon_social}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.empresa_id && (
                                        <p className="text-rose-500 text-xs font-medium">{errors.empresa_id}</p>
                                    )}
                                </div>

                                {/* Sucursal */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="user-sucursal" className="text-xs font-semibold">
                                        {__('Branch')}
                                    </Label>
                                    <Select
                                        value={data.sucursal_id ? String(data.sucursal_id) : 'none'}
                                        onValueChange={(v) => setData('sucursal_id', v === 'none' ? '' : v)}
                                        disabled={!data.empresa_id}
                                    >
                                        <SelectTrigger id="user-sucursal" className="h-10 w-full rounded-xl">
                                            <SelectValue
                                                placeholder={
                                                    data.empresa_id ? __('None') : __('Select a company first')
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{__('None')}</SelectItem>
                                            {filteredSucursales.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.sucursal_id && (
                                        <p className="text-rose-500 text-xs font-medium">{errors.sucursal_id}</p>
                                    )}
                                </div>

                                {/* Estado */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label htmlFor="user-status" className="text-xs font-semibold">
                                        {__('Status')} <span className="text-rose-500">*</span>
                                    </Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(v: 'activo' | 'inactivo' | 'suspendido') => setData('status', v)}
                                    >
                                        <SelectTrigger id="user-status" className="h-10 w-full rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="activo">{__('Active')}</SelectItem>
                                            <SelectItem value="inactivo">{__('Inactive')}</SelectItem>
                                            <SelectItem value="suspendido">{__('Suspended')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-rose-500 text-xs font-medium">{errors.status}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sección 3: Roles Asignados */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-3">
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        {__('Assign Roles')}
                                    </h4>
                                </div>
                                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                    {data.roles.length} seleccionado{data.roles.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {roles.map((r) => {
                                    const isChecked = data.roles.includes(r.name);
                                    const isPrivileged = isPrivilegedRoleName(r.name);
                                    const isDisabled = isPrivileged && !isActorSuperAdmin;

                                    return (
                                        <label
                                            key={r.id}
                                            htmlFor={`role-check-${r.id}`}
                                            className={cn(
                                                'flex items-center justify-between gap-2.5 rounded-xl border p-3 transition-all select-none',
                                                isDisabled
                                                    ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800'
                                                    : 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700',
                                                isChecked
                                                    ? isPrivileged
                                                        ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800'
                                                        : 'bg-indigo-50/70 border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-800'
                                                    : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800'
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Checkbox
                                                    id={`role-check-${r.id}`}
                                                    checked={isChecked}
                                                    disabled={isDisabled}
                                                    onCheckedChange={(checked) => handleRoleChange(r.name, !!checked)}
                                                />
                                                <span className="text-xs font-semibold capitalize text-slate-800 dark:text-slate-100 truncate">
                                                    {r.name}
                                                </span>
                                            </div>
                                            {isDisabled ? (
                                                <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            ) : isChecked ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                            ) : null}
                                        </label>
                                    );
                                })}
                            </div>
                            {errors.roles && <p className="text-rose-500 text-xs font-medium">{errors.roles}</p>}
                        </div>
                    </div>

                    {/* Footer fijo */}
                    <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/70 flex items-center justify-end gap-2.5 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                            className="rounded-xl"
                        >
                            {__('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20"
                        >
                            {processing
                                ? __('Saving...')
                                : editingUser
                                  ? __('Save Changes')
                                  : 'Crear Usuario'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
