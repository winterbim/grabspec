'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompanyProfile, setCompanyProfile } from '@/lib/db';
import type { CompanyProfile } from '@/types';

const EMPTY_PROFILE: CompanyProfile = {
  name: '', address: '', zipCode: '', city: '', country: 'Suisse',
  phone: '', email: '', website: '', logo: null,
};

export function CompanySettings() {
  const t = useTranslations('library.company');
  const [profile, setProfile] = useState<CompanyProfile>(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCompanyProfile().then((p) => {
      if (p) setProfile(p);
      setLoaded(true);
    });
  }, []);

  const save = useCallback(async (updated: CompanyProfile) => {
    setProfile(updated);
    await setCompanyProfile(updated);
  }, []);

  const handleField = (field: keyof CompanyProfile, value: string) => {
    const updated = { ...profile, [field]: value };
    save(updated);
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('logoTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...profile, logo: reader.result as string };
      save(updated);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    const updated = { ...profile, logo: null };
    save(updated);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            {profile.logo ? (
              <div className="relative">
                <img
                  src={profile.logo}
                  alt="Logo"
                  className="h-16 w-16 rounded-lg border object-contain"
                />
                <button
                  onClick={removeLogo}
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500"
              >
                <Upload className="h-5 w-5" />
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleLogo}
              className="hidden"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Input
              placeholder={t('companyName')}
              value={profile.name}
              onChange={(e) => handleField('name', e.target.value)}
            />
            <Input
              placeholder={t('address')}
              value={profile.address}
              onChange={(e) => handleField('address', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder={t('zipCode')}
            value={profile.zipCode}
            onChange={(e) => handleField('zipCode', e.target.value)}
          />
          <Input
            placeholder={t('city')}
            value={profile.city}
            onChange={(e) => handleField('city', e.target.value)}
          />
          <Input
            placeholder={t('country')}
            value={profile.country}
            onChange={(e) => handleField('country', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder={t('phone')}
            value={profile.phone}
            onChange={(e) => handleField('phone', e.target.value)}
          />
          <Input
            placeholder={t('email')}
            value={profile.email}
            onChange={(e) => handleField('email', e.target.value)}
          />
        </div>
        <Input
          placeholder={t('website')}
          value={profile.website}
          onChange={(e) => handleField('website', e.target.value)}
        />
      </CardContent>
    </Card>
  );
}
