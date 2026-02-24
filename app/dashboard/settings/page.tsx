"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { usePathname, useRouter } from 'next/navigation';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { getAssetUrl } from '@/lib/asset-utils';
import { Stethoscope, Loader2, Save, Edit, X, Upload } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

interface CompanySettings {
    companyName: string;
    website: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    taxName: string;
    tax: number;
    currency: string;
    gst: string;
    billPrefix: string;
    stateCode: string;
    bankName: string;
    accountNo: string;
    ifsc: string;
    beneficiaryName: string;
    pan: string;
    billStartNo: number;
    bookingStartNo: number;
    workOrderStartNo: number;
    quotationStartNo: number;
    purchaseOrderStartNo: number;
    aboutUs: string;
    facebook: string;
    twitter: string;
    youtube: string;
    instagram: string;
    logo: string;
    signature: string;
    resetSalesBillCounter: boolean;
    resetPurchaseBillCounter: boolean;
    resetBookingCounter: boolean;
}

export default function SettingsPage() {
    const { user, loading: authLoading, authFetch } = useAuth();
    const { can } = usePermission();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [settings, setSettings] = useState<CompanySettings>({
        companyName: '',
        website: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        taxName: '',
        tax: 0,
        currency: '',
        gst: '',
        billPrefix: '',
        stateCode: '',
        bankName: '',
        accountNo: '',
        ifsc: '',
        beneficiaryName: '',
        pan: '',
        billStartNo: 0,
        bookingStartNo: 0,
        workOrderStartNo: 0,
        quotationStartNo: 0,
        purchaseOrderStartNo: 0,
        aboutUs: '',
        facebook: '',
        twitter: '',
        youtube: '',
        instagram: '',
        logo: '',
        signature: '',
        resetSalesBillCounter: false,
        resetPurchaseBillCounter: false,
        resetBookingCounter: false,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [originalSettings, setOriginalSettings] = useState<CompanySettings | null>(null);
    const [adminSettings, setAdminSettings] = useState({ companyName: 'SRM Arnik', logo: '' });
    const [uploadingAdminLogo, setUploadingAdminLogo] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!can('view', pathname)) {
                router.push('/dashboard');
            } else {
                fetchSettings();
            }
        }
    }, [user, authLoading, can, router, pathname]);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const [companyResponse, adminResponse] = await Promise.all([
                authFetch('/api/company-settings'),
                authFetch(`${API_BASE_URL}/api/cms/home/adminSetting`)
            ]);
            
            if (!companyResponse.ok) {
                let errorMsg = 'Failed to fetch settings';
                if (companyResponse.status === 404) {
                    errorMsg = 'Company settings not found. Please contact administrator.';
                } else if (companyResponse.status === 403) {
                    errorMsg = 'You do not have permission to view settings.';
                } else if (companyResponse.status >= 500) {
                    errorMsg = 'Server error. Please try again later.';
                }
                throw new Error(errorMsg);
            }
            
            const companyData = await companyResponse.json();
            if (companyData.success) {
                setSettings(companyData.data);
                setOriginalSettings(companyData.data);
            } else {
                throw new Error(companyData.message || 'Failed to fetch settings');
            }
            
            if (adminResponse.ok) {
                const adminData = await adminResponse.json();
                setAdminSettings({
                    companyName: adminData.data?.companyName || 'SRM Arnik',
                    logo: adminData.data?.logo || ''
                });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        console.log('Save payload:', settings);
        try {
            // Save company settings
            const response = await authFetch('/api/company-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await response.json();
            
            // Save admin settings separately
            const adminSettingsData = {
                page: "admin",
                section: "settings",
                data: adminSettings
            };
            
            await authFetch(`${API_BASE_URL}/api/cms/home/adminSetting`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminSettingsData)
            });
            
            if (data.success) {
                toast({ title: 'Success', description: 'Settings updated successfully' });
                setIsEditing(false);
                // Reload to reflect admin panel changes
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update settings' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (file: File, type: 'logo' | 'signature' | 'adminLogo') => {
        const setUploading = type === 'logo' ? setUploadingLogo : type === 'signature' ? setUploadingSignature : setUploadingAdminLogo;
        setUploading(true);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await authFetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Upload failed');
            
            const data = await response.json();
            console.log('File upload response:', data);
            
            if (type === 'adminLogo') {
                setAdminSettings(s => ({ ...s, logo: data.url }));
            } else {
                setSettings(s => ({ ...s, [type]: data.url }));
            }
            
            toast({ title: 'Success', description: `${type === 'logo' ? 'Logo' : type === 'signature' ? 'Signature' : 'Admin Logo'} uploaded successfully` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: (error as Error).message });
        } finally {
            setUploading(false);
        }
    };

    if (authLoading || !user || isLoading) {
        return <div className="flex items-center justify-center h-screen"><Stethoscope className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-600 via-gray-700 to-slate-800 p-4 text-white shadow-2xl">
                <div className="absolute inset-0 bg-black/20 -z-10"></div>
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl -z-10"></div>
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gray-400/20 rounded-full blur-2xl -z-10"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                                Company Settings
                            </h1>
                            <p className="text-gray-100 text-sm">
                                Manage your company information and configuration
                            </p>
                        </div>
                        {isEditing ? (
                            <Button 
                                variant="destructive" 
                                onClick={() => {
                                    if (originalSettings) {
                                        setSettings(originalSettings);
                                    }
                                    setIsEditing(false);
                                }}
                                className="relative z-20"
                            >
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                        ) : (
                            <Button 
                                variant="secondary" 
                                onClick={() => setIsEditing(true)}
                                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 relative z-20"
                            >
                                <Edit className="mr-2 h-4 w-4" /> Edit Settings
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Company Details */}
                <Card className="animate-slide-up">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                            Company Details
                        </CardTitle>
                        <CardDescription>Basic company information and contact details</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input readOnly={!isEditing} value={settings.companyName} onChange={e => setSettings(s => ({...s, companyName: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input readOnly={!isEditing} value={settings.website} onChange={e => setSettings(s => ({...s, website: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Person</Label>
                            <Input readOnly={!isEditing} value={settings.contactPerson} onChange={e => setSettings(s => ({...s, contactPerson: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input readOnly={!isEditing} value={settings.phone} onChange={e => setSettings(s => ({...s, phone: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input readOnly={!isEditing} type="email" value={settings.email} onChange={e => setSettings(s => ({...s, email: e.target.value}))} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Address</Label>
                            <Textarea readOnly={!isEditing} value={settings.address} onChange={e => setSettings(s => ({...s, address: e.target.value}))} />
                        </div>
                    </CardContent>
                </Card>

                {/* Tax & Financial Details */}
                <Card className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">
                            Tax & Financial Details
                        </CardTitle>
                        <CardDescription>Tax configuration and financial information</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tax Name</Label>
                            <Input readOnly={!isEditing} value={settings.taxName} onChange={e => setSettings(s => ({...s, taxName: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Tax (%)</Label>
                            <Input readOnly={!isEditing} type="number" step="0.01" value={settings.tax} onChange={e => setSettings(s => ({...s, tax: Number(e.target.value)}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Input readOnly={!isEditing} value={settings.currency} onChange={e => setSettings(s => ({...s, currency: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>GST</Label>
                            <Input readOnly={!isEditing} value={settings.gst} onChange={e => setSettings(s => ({...s, gst: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Bill Prefix</Label>
                            <Input readOnly={!isEditing} value={settings.billPrefix} onChange={e => setSettings(s => ({...s, billPrefix: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>State Code</Label>
                            <Input readOnly={!isEditing} value={settings.stateCode} onChange={e => setSettings(s => ({...s, stateCode: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>PAN</Label>
                            <Input readOnly={!isEditing} value={settings.pan} onChange={e => setSettings(s => ({...s, pan: e.target.value}))} />
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Details */}
                <Card className="animate-slide-up" style={{animationDelay: '0.2s'}}>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent dark:from-orange-400 dark:to-red-400">
                            Bank Details
                        </CardTitle>
                        <CardDescription>Banking information for transactions</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bank Name</Label>
                            <Input readOnly={!isEditing} value={settings.bankName} onChange={e => setSettings(s => ({...s, bankName: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Number</Label>
                            <Input readOnly={!isEditing} value={settings.accountNo} onChange={e => setSettings(s => ({...s, accountNo: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>IFSC Code</Label>
                            <Input readOnly={!isEditing} value={settings.ifsc} onChange={e => setSettings(s => ({...s, ifsc: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Beneficiary Name</Label>
                            <Input readOnly={!isEditing} value={settings.beneficiaryName} onChange={e => setSettings(s => ({...s, beneficiaryName: e.target.value}))} />
                        </div>
                    </CardContent>
                </Card>

                {/* Numbering Configuration */}
                <Card className="animate-slide-up" style={{animationDelay: '0.3s'}}>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
                            Numbering Configuration
                        </CardTitle>
                        <CardDescription>Starting numbers for various document types</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bill Start Number</Label>
                            <Input readOnly={!isEditing} type="number" value={settings.billStartNo} onChange={e => setSettings(s => ({...s, billStartNo: Number(e.target.value)}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Booking Start Number</Label>
                            <Input readOnly={!isEditing} type="number" value={settings.bookingStartNo} onChange={e => setSettings(s => ({...s, bookingStartNo: Number(e.target.value)}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Work Order Start Number</Label>
                            <Input readOnly={!isEditing} type="number" value={settings.workOrderStartNo} onChange={e => setSettings(s => ({...s, workOrderStartNo: Number(e.target.value)}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Quotation Start Number</Label>
                            <Input readOnly={!isEditing} type="number" value={settings.quotationStartNo} onChange={e => setSettings(s => ({...s, quotationStartNo: Number(e.target.value)}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Purchase Order Start Number</Label>
                            <Input readOnly={!isEditing} type="number" value={settings.purchaseOrderStartNo} onChange={e => setSettings(s => ({...s, purchaseOrderStartNo: Number(e.target.value)}))} />
                        </div>
                    </CardContent>
                </Card>

                {/* Social Media */}
                <Card className="animate-slide-up" style={{animationDelay: '0.4s'}}>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-blue-400">
                            Social Media
                        </CardTitle>
                        <CardDescription>Social media links and online presence</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Facebook</Label>
                            <Input readOnly={!isEditing} value={settings.facebook} onChange={e => setSettings(s => ({...s, facebook: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Twitter</Label>
                            <Input readOnly={!isEditing} value={settings.twitter} onChange={e => setSettings(s => ({...s, twitter: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>YouTube</Label>
                            <Input readOnly={!isEditing} value={settings.youtube} onChange={e => setSettings(s => ({...s, youtube: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Instagram</Label>
                            <Input readOnly={!isEditing} value={settings.instagram} onChange={e => setSettings(s => ({...s, instagram: e.target.value}))} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>About Us</Label>
                            <Textarea readOnly={!isEditing} value={settings.aboutUs} onChange={e => setSettings(s => ({...s, aboutUs: e.target.value}))} />
                        </div>
                    </CardContent>
                </Card>

                {/* Admin Panel Settings */}
                <Card className="animate-slide-up" style={{animationDelay: '0.5s'}}>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                            Admin Panel Settings
                        </CardTitle>
                        <CardDescription>Configure admin panel branding (company name and logo will be used throughout the admin interface)</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Admin Panel Company Name</Label>
                            <Input 
                                readOnly={!isEditing} 
                                value={adminSettings.companyName} 
                                onChange={e => setAdminSettings(s => ({...s, companyName: e.target.value}))}
                                placeholder="SRM Arnik"
                            />
                            <p className="text-xs text-muted-foreground">This name will appear in the admin panel header and login page</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Admin Panel Logo</Label>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <Input
                                        value={adminSettings.logo}
                                        onChange={e => setAdminSettings(s => ({...s, logo: e.target.value}))}
                                        placeholder="Image URL"
                                        className="flex-1"
                                    />
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileUpload(file, 'adminLogo');
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            disabled={uploadingAdminLogo}
                                        />
                                        <Button variant="outline" disabled={uploadingAdminLogo}>
                                            {uploadingAdminLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {adminSettings.logo && (
                                <div className="mt-2">
                                    <img src={getAssetUrl(adminSettings.logo)} alt="Admin Logo" width={80} height={80} className="object-contain rounded" />
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">This logo will appear in the admin panel and login page</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Logo & Signature */}
                <Card className="animate-slide-up" style={{animationDelay: '0.6s'}}>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-green-400">
                            Logo & Signature
                        </CardTitle>
                        <CardDescription>Upload company logo and signature for documents</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Company Logo</Label>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <Input
                                        value={settings.logo}
                                        onChange={e => setSettings(s => ({...s, logo: e.target.value}))}
                                        placeholder="Image URL"
                                        className="flex-1"
                                    />
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileUpload(file, 'logo');
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            disabled={uploadingLogo}
                                        />
                                        <Button variant="outline" disabled={uploadingLogo}>
                                            {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {settings.logo && (
                                <div className="mt-2">
                                    <img src={getAssetUrl(settings.logo)} alt="Logo" width={80} height={80} className="object-contain rounded" />
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">Recommended: 200x200px (square)</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Signature</Label>
                            {isEditing && (
                                <Input 
                                    type="file" 
                                    accept="image/*" 
                                    disabled={uploadingSignature}
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file, 'signature');
                                    }} 
                                />
                            )}
                            {uploadingSignature && (
                                <div className="space-y-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Uploading signature...</p>
                                </div>
                            )}
                            <div className="h-20 w-32 border rounded flex items-center justify-center bg-muted">
                                {settings.signature ? (
                                    <img src={getAssetUrl(settings.signature)} alt="Signature" className="h-full w-full object-contain rounded" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">No Signature</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Counter Reset Options */}
                <Card className="animate-slide-up" style={{animationDelay: '0.7s'}}>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-orange-400">
                            Counter Reset Options
                        </CardTitle>
                        <CardDescription>Configure automatic counter resets at financial year end</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="reset-sales" 
                                disabled={!isEditing}
                                checked={settings.resetSalesBillCounter} 
                                onCheckedChange={checked => setSettings(s => ({...s, resetSalesBillCounter: !!checked}))}
                            />
                            <Label htmlFor="reset-sales">Reset Sales Bill Counter after FY end</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="reset-purchase" 
                                disabled={!isEditing}
                                checked={settings.resetPurchaseBillCounter} 
                                onCheckedChange={checked => setSettings(s => ({...s, resetPurchaseBillCounter: !!checked}))}
                            />
                            <Label htmlFor="reset-purchase">Reset Purchase Bill Counter after FY end</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="reset-booking" 
                                disabled={!isEditing}
                                checked={settings.resetBookingCounter} 
                                onCheckedChange={checked => setSettings(s => ({...s, resetBookingCounter: !!checked}))}
                            />
                            <Label htmlFor="reset-booking">Reset Booking No. Counter after FY end</Label>
                        </div>
                    </CardContent>
                </Card>

                {isEditing && (
                    <div className="flex justify-end animate-scale-in">
                        <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
