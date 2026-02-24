

"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { CmsContent } from '@/lib/data';
import { getAssetUrl } from '@/lib/asset-utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, PlusCircle, Trash2, Palette, Check, Upload } from 'lucide-react';
import { MagicTextarea } from '@/components/magic-textarea';
import { RichTextEditor } from '@/components/rich-text-editor';
import { usePermission } from '@/hooks/use-permission';
import { useRouter, usePathname } from 'next/navigation';

// A lean schema defining the structure of the website content.
// This replaces the large, hardcoded initial data object.
const cmsSchema = [
  { page: 'home', section: 'topbar', data: { location: "", phone: "", email: "", facebook: "", twitter: "", instagram: "", linkedin: "" } },
  { page: 'home', section: 'navbar', data: [{ id: "1", text: "", link: "" }] },
  { page: 'home', section: 'carousel', data: [{ id: "slide1", image: "", headline_small: "", headline_main: "", description: "", button_text: "", button_link: "" }] },
  { page: 'home', section: 'whatWeDo', data: { title: "", subtitle: "" } },
  {
      page: 'home',
      section: 'homepage_about',
      data: {
          image1: "",
          image2: "",
          experience_years: "",
          subtitle: "About Us",
          title: "SRM ARNIK SKIN & HEALTHCARE CLINIC",
          description: "SRM ARNIK SKIN & HEALTHCARE CLINIC aims to be a one-stop destination for health and aesthetic needs, combining specialized dermatology with the convenience of multi-specialty medical care.",
          slug: "",
          meta_title: "",
          meta_description: "",
          keywords: [""],
          alt_text_image1: "",
          alt_text_image2: ""
      }
  },
  { page: 'home', section: 'services', data: [{ id: "service1", title: "", description: "", image: "", slug: "", meta_title: "", meta_description: "", keywords: [""], alt_text: "", short_highlights: [""] }] },
  { page: 'home', section: 'whyChooseUsHeader', data: { title: "", subtitle: "" } },
  { page: 'home', section: 'whyChooseUs', data: [{ id: "feature1", icon: "", title: "", description: "" }] },
  { page: 'home', section: 'ctaBlock', data: { title: "", subtitle: "", left_title: "", left_description: "", right_title: "", right_description: "" } },
  { page: 'home', section: 'activitiesHeader', data: { title: "Clinic Activities", subtitle: "See What's Happening at SRM Arnik" } },
  { page: 'home', section: 'activities', data: [{ id: "1", title: "", description: "", videoUrl: "", thumbnailUrl: "" }] },
  { page: 'home', section: 'portfolioHeader', data: { title: "Our Portfolio", subtitle: "A Glimpse into Our Transformative Results" } },
  { page: 'home', section: 'portfolio', data: [{ id: "1", title: "", imageUrl: "" }] },
  { 
    page: 'home', 
    section: 'before_after', 
    data: [
      {
        id: "1",
        beforeImageUrl: "",
        afterImageUrl: "",
        title: "",
        description: ""
      }
    ]
  },
  { page: 'home', section: 'testimonialsHeader', data: { title: "What Our Patients Say", subtitle: "Real Stories, Real Results" } },
  { page: 'home', section: 'testimonials', data: [{ id: "1", name: "", title: "", quote: "", rating: 5, avatarUrl: "" }] },
  { page: 'home', section: 'blogHeader', data: { title: "From Our Blog", subtitle: "Latest News & Updates" } },
  { page: 'home', section: 'blog', data: [{ id: "1", title: "", content: "", author: "", date: "", imageUrl: "", slug: "", meta_title: "", meta_description: "", keywords: [""], alt_text: "" }] },
  { 
      page: 'home', 
      section: 'faqHeader', 
      data: { 
          title: "Frequently Asked Questions", 
          subtitle: "Find answers to common questions about our services, appointments, and policies." 
      } 
  },
  { 
      page: 'home', 
      section: 'faqs', 
      data: [
          {
              id: "1",
              question: "What are your clinic hours?",
              answer: "Our clinic is open Monday to Saturday from 9:00 AM to 6:00 PM. We are closed on Sundays and public holidays. Emergency consultations can be arranged by calling our emergency number."
          },
          {
              id: "2",
              question: "How do I book an appointment?",
              answer: "You can book an appointment through our online booking system on this website, call our reception at the clinic, or visit us in person. We recommend booking in advance to secure your preferred time slot."
          },
          {
              id: "3",
              question: "Do you accept insurance?",
              answer: "Yes, we accept most major health insurance plans. Please bring your insurance card and a valid ID to your appointment. Our staff will help verify your coverage and benefits."
          },
          {
              id: "4",
              question: "What should I bring to my first appointment?",
              answer: "Please bring a valid photo ID, your insurance card, a list of current medications, and any relevant medical records or test results. Arrive 15 minutes early to complete necessary paperwork."
          },
          {
              id: "5",
              question: "What skin conditions do you treat?",
              answer: "We treat a wide range of skin conditions including acne, eczema, psoriasis, dermatitis, skin infections, moles, skin cancer screening, anti-aging treatments, and cosmetic dermatology procedures."
          },
          {
              id: "6",
              question: "Do you offer emergency services?",
              answer: "For urgent skin conditions, please call our clinic during business hours. For after-hours emergencies, please visit the nearest emergency room or call emergency services."
          }
      ] 
  },
  {
      page: 'home',
      section: 'footer',
      data: {
          logoUrl: "",
          title: "SRM ARNIK",
          description: "Your trusted destination for comprehensive skincare and healthcare services...",
          socialLinks: {
              facebook: "https://facebook.com/yourpage",
              twitter: "https://twitter.com/yourpage",
              instagram: "https://instagram.com/yourpage",
              linkedin: "https://linkedin.com/yourpage",
          },
          quickLinks: [
              { id: "ql1", label: "About Us", url: "/about" },
              { id: "ql2", label: "Contact Us", url: "/contact" },
              { id: "ql3", label: "Privacy Policy", url: "/privacy-policy" },
              { id: "ql4", label: "Terms & Conditions", url: "/terms" },
              { id: "ql5", label: "Our Blog & News", url: "/blog" },
              { id: "ql6", label: "Our Team", url: "/team" },
          ],
          services: [
              { id: "s1", name: "Dermatology", url: "/services/dermatology" },
              { id: "s2", name: "Cosmetic Treatments", url: "/services/cosmetic" },
              { id: "s3", name: "Hair Care", url: "/services/hair-care" },
              { id: "s4", name: "Aesthetic Services", url: "/services/aesthetic" },
              { id: "s5", name: "General Medicine", url: "/services/general" },
              { id: "s6", name: "Wellness Services", url: "/services/wellness" },
          ],
          contactInfo: {
              address: "Near Axis Mall, New Town, Kolkata",
              email: "contact@srmarnik.com",
              phone1: "+91 98765 43210",
              phone2: "+91 98765 43211",
          },
          copyright: "SRM ARNIK SKIN & HEALTHCARE CLINIC, All rights reserved.",
          designer: {
              name: "T2P Office",
              url: "#",
          },
      }
  },
  { page: 'about', section: 'aboutHeader', data: { title: "" } },
  { page: 'about', section: 'aboutIntro', data: { title: "", description: "" } },
  { page: 'about', section: 'keyPoints', data: [{ id: "kp1", text: "" }] },
  { page: 'about', section: 'aboutDetails', data: { vision: "", overview: "" } },
  { page: 'about', section: 'experienceBlock', data: { text: "", image: "" } },
  { page: 'about', section: 'highlights', data: [{ id: "highlight1", icon: "", title: "", description: "" }] },
  { page: 'about', section: 'teamHeader', data: { title: "", subtitle: "" } },
  { page: 'about', section: 'teamMembers', data: [{ id: "team1", name: "", role: "", image: "", slug: "", title: "", short_description: "", description: "", keywords: [""] }] },
  { 
      page: 'contact', 
      section: 'header', 
      data: {
          heading: "Contact Us",
          description: "Experience exceptional skincare and healthcare services at SRM ARNIK. Our team of expert dermatologists and healthcare professionals is dedicated to providing personalized treatments and comprehensive care solutions. Schedule your consultation today and take the first step towards healthier skin and overall wellness.",
      } 
  },
  { 
      page: 'contact', 
      section: 'form', 
      data: {
          heading: "Get in Touch",
          description: "We're here to help you achieve your skin and healthcare goals. Contact us for consultations, appointments, or any questions about our services. Our expert team is ready to provide you with personalized care and professional guidance.",
      }
  },
  {
      page: 'contact',
      section: 'contactInfo',
      data: {
          address: "123 Healthcare Avenue, Mumbai, Maharashtra, India",
          phones: [{ id: "phone1", number: "+012 345 67890" }, { id: "phone2", number: "+012 345 67890" }],
          emails: [{ id: "email1", address: "info@example.com" }, { id: "email2", address: "info@example.com" }],
      }
  },
  {
      page: 'contact',
      section: 'mapEmbedUrl',
      data: {
          url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241317.11609823277!2d72.74109995644228!3d19.08219783958221!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1694259649153!5m2!1sen!2sin",
      }
  }
];


type PageContent = { [section: string]: any };
type PageName = 'home' | 'about' | 'contact';

type ThemeSettings = {
  enabled: boolean;
  version: string;
  colorPalette: string;
  availableVersions: Array<{ name: string; label: string }>;
  availablePalettes: Array<{ name: string; label: string; colors: string[] }>;
};


const imageSizeHints: { [key: string]: string } = {
  'home-carousel-image': 'Required: 1920x1080px',
  'home-homepage_about-image1': 'Required: 500x600px',
  'home-homepage_about-image2': 'Required: 250x250px',
  'home-services-image': 'Required: 400x300px',
  'home-whyChooseUs-icon': 'Required: Square image, max 750x750px',
  'home-before_after-beforeimageurl': 'Required: 300x400px',
  'home-before_after-afterimageurl': 'Required: 300x400px',
  'about-experienceBlock-image': 'Required: 500x600px',
  'about-highlights-icon': 'Required: 64x64px',
  'about-teamMembers-image': 'Required: 500x550px',
};

const imageDimensionConstraints: { [key: string]: { width: number; height: number } } = {
    'home-carousel-image': { width: 1920, height: 1080 },
    'home-homepage_about-image1': { width: 500, height: 600 },
    'home-homepage_about-image2': { width: 250, height: 250 },
    'home-services-image': { width: 400, height: 300 },
    'home-before_after-beforeimageurl': { width: 300, height: 400 },
    'home-before_after-afterimageurl': { width: 300, height: 400 },
    'about-experienceBlock-image': { width: 500, height: 600 },
    'about-teamMembers-image': { width: 500, height: 550 },
};


export default function CmsPage() {
  const { authFetch, token, loading: authLoading, user } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [homeContent, setHomeContent] = useState<PageContent | null>(null);
  const [aboutContent, setAboutContent] = useState<PageContent | null>(null);
  const [contactContent, setContactContent] = useState<PageContent | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  const fetchAllContent = useCallback(async () => {
    setIsLoading(true);

    try {
      const sectionsToFetch = cmsSchema.map(item => ({ page: item.page, section: item.section }));
      
      const fetchPromises = [
        ...sectionsToFetch.map(({ page, section }) => authFetch(`/api/cms/${page}/${section}`)),
        authFetch('/api/cms/home/settings')
      ];

      const responses = await Promise.all(fetchPromises);
      
      const newHomeContent: PageContent = {};
      const newAboutContent: PageContent = {};
      const newContactContent: PageContent = {};

      // Handle theme settings response
      const themeRes = responses[responses.length - 1];
      if (themeRes.ok) {
        const themeData = await themeRes.json();
        setThemeSettings(themeData.data);
      } else {
        // Default theme settings if not found
        setThemeSettings({
          enabled: true,
          version: 'v2',
          colorPalette: 'stone',
          availableVersions: [
            { name: 'v1', label: 'Classic Style' },
            { name: 'v2', label: 'Modern Style' },
            { name: 'v3', label: 'Minimal Style' },
            { name: 'v4', label: 'Advanced Style' }
          ],
          availablePalettes: [
            { name: 'default', label: 'Default', colors: ['hsl(173 80% 25%)', 'hsl(174 65% 85%)'] },
            { name: 'green', label: 'Green', colors: ['hsl(142 76% 36%)', 'hsl(142 50% 90%)'] },
            { name: 'blue', label: 'Blue', colors: ['hsl(217 91% 60%)', 'hsl(216 100% 97%)'] },
            { name: 'rose', label: 'Rose', colors: ['hsl(347 77% 58%)', 'hsl(347 30% 92%)'] },
            { name: 'indigo', label: 'Indigo', colors: ['hsl(245 86% 59%)', 'hsl(245 50% 93%)'] },
            { name: 'orange', label: 'Orange', colors: ['hsl(25 95% 53%)', 'hsl(25 50% 94%)'] },
            { name: 'slate', label: 'Slate', colors: ['hsl(215 39% 51%)', 'hsl(215 20% 92%)'] },
            { name: 'stone', label: 'Stone', colors: ['hsl(35 22% 50%)', 'hsl(35 15% 91%)'] },
            { name: 'violet', label: 'Violet', colors: ['hsl(262 82% 62%)', 'hsl(262 50% 93%)'] },
            { name: 'teal', label: 'Teal', colors: ['hsl(180 75% 40%)', 'hsl(180 40% 90%)'] },
            { name: 'red', label: 'Red', colors: ['hsl(0 72% 51%)', 'hsl(0 80% 96%)'] }
          ]
        });
      }

      for (let i = 0; i < sectionsToFetch.length; i++) {
        const res = responses[i];
        const { page, section } = sectionsToFetch[i];
        
        let contentData;
        if (res.ok) {
          const contentItem = await res.json();
          contentData = contentItem.data;
        } else {
          // If content is not found in DB (404), use the default schema structure.
          contentData = cmsSchema.find(item => item.page === page && item.section === section)?.data;
        }

        if (page === 'home') {
            newHomeContent[section] = contentData;
        } else if (page === 'about') {
            newAboutContent[section] = contentData;
        } else if (page === 'contact') {
            newContactContent[section] = contentData;
        }
      }
      
      setHomeContent(newHomeContent);
      setAboutContent(newAboutContent);
      setContactContent(newContactContent);

    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
       }
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !can('view', pathname)) {
        router.push('/dashboard');
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab && ['home', 'about', 'contact', 'theme'].includes(tab)) {
          setActiveTab(tab);
        }
        fetchAllContent();
      }
    }
  }, [authLoading, user, can, pathname, router, fetchAllContent]);

  const handleFieldChange = (page: PageName, section: string, field: string, value: any, index?: number) => {
    let setContent;
    if (page === 'home') setContent = setHomeContent;
    else if (page === 'about') setContent = setAboutContent;
    else setContent = setContactContent;

    setContent(prev => {
      if (!prev) return null;
      const newContent = JSON.parse(JSON.stringify(prev));
      
      let current = newContent[section];
      const fieldPath = field.split('.');
      
      if(index !== undefined && Array.isArray(newContent[section]) && newContent[section][index]) {
          newContent[section][index][fieldPath[fieldPath.length - 1]] = value;
          // Auto-generate slug for services and blog when title changes
          if ((section === 'services' || section === 'blog') && fieldPath[fieldPath.length - 1] === 'title' && value) {
            newContent[section][index]['slug'] = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          }
          // Auto-generate slug for team members when name changes
          if (section === 'teamMembers' && fieldPath[fieldPath.length - 1] === 'name' && value) {
            newContent[section][index]['slug'] = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          }
          // Auto-format slug when manually edited for array items
          if ((section === 'services' || section === 'blog' || section === 'teamMembers') && fieldPath[fieldPath.length - 1] === 'slug' && value) {
            newContent[section][index]['slug'] = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          }
      } else if (index !== undefined) { // We are inside a nested array
          let arrayToModify = current;
          for(let i=0; i<fieldPath.length - 1; i++){
              arrayToModify = arrayToModify[fieldPath[i]];
          }
          if(Array.isArray(arrayToModify) && arrayToModify[index]) {
             arrayToModify[index][fieldPath[fieldPath.length - 1]] = value;
          }
      } else { // We are inside a simple object or nested object
        for (let i = 0; i < fieldPath.length - 1; i++) {
            current = current[fieldPath[i]];
        }
        current[fieldPath[fieldPath.length - 1]] = value;
        // Auto-generate slug for homepage_about when title changes
        if (section === 'homepage_about' && fieldPath[fieldPath.length - 1] === 'title' && value) {
          current['slug'] = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
        // Auto-format slug when manually edited for homepage_about
        if (section === 'homepage_about' && fieldPath[fieldPath.length - 1] === 'slug' && value) {
          current['slug'] = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
      }
      return newContent;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, page: PageName, section: string, field: string, index?: number) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validationKey = `${page}-${section}-${field.split('.').pop()}`;
      const constraints = imageDimensionConstraints[validationKey];
      
      const objectUrl = URL.createObjectURL(file);
      const image = new window.Image();
      image.src = objectUrl;

      image.onload = async () => {
          URL.revokeObjectURL(objectUrl);
          
          if (validationKey === 'home-whyChooseUs-icon') {
            const isSquare = Math.abs(image.width - image.height) <= 5;
            const isTooLarge = image.width > 750 || image.height > 750;

            if (!isSquare) {
                toast({
                    variant: "destructive",
                    title: "Invalid Image Shape",
                    description: `Icon must be a square image. Yours is ${image.width}x${image.height}px. A 5px tolerance is allowed.`
                });
                e.target.value = '';
                return;
            }
            if (isTooLarge) {
                toast({
                    variant: "destructive",
                    title: "Image Too Large",
                    description: `Icon dimensions cannot exceed 750x750px. Yours is ${image.width}x${image.height}px.`
                });
                e.target.value = '';
                return;
            }
          } else if (constraints && (image.width !== constraints.width || image.height !== constraints.height)) {
              toast({
                  variant: "destructive",
                  title: "Invalid Image Dimensions",
                  description: `Please upload an image with dimensions ${constraints.width}x${constraints.height}px. Yours is ${image.width}x${image.height}px.`,
              });
              e.target.value = '';
              return;
          }

          const formData = new FormData();
          formData.append('file', file);
          
          try {
            const response = await authFetch('/api/upload', { method: 'POST', body: formData });
            if(!response.ok) throw new Error("Upload failed");
            
            const { url } = await response.json();
            handleFieldChange(page, section, field, url, index);
          } catch (error) {
              if (!(error as Error).message.includes('Session expired')) {
                toast({ variant: 'destructive', title: 'Upload Failed', description: (error as Error).message });
              }
          }
      };

      image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          toast({ variant: "destructive", title: "Invalid File", description: "The selected file could not be read as an image." });
          e.target.value = '';
      };
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>, page: PageName, section: string, field: string, index?: number) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('video/')) {
          toast({ variant: "destructive", title: "Invalid File", description: "Please select a video file." });
          e.target.value = '';
          return;
      }

      const uploadKey = `${page}-${section}-${field}-${index ?? 'root'}`;
      setUploadingVideo(uploadKey);

      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await authFetch('/api/upload', { method: 'POST', body: formData });
        if(!response.ok) throw new Error("Upload failed");
        
        const { url } = await response.json();
        handleFieldChange(page, section, field, url, index);
        toast({ title: "Success", description: "Video uploaded successfully." });
      } catch (error) {
          if (!(error as Error).message.includes('Session expired')) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: (error as Error).message });
          }
      } finally {
        setUploadingVideo(null);
      }
  };
  
  const handleAddItem = (page: PageName, section: string, fieldPath: string) => {
    let setContent;
    if (page === 'home') setContent = setHomeContent;
    else if (page === 'about') setContent = setAboutContent;
    else setContent = setContactContent;

    setContent(prev => {
        if (!prev) return null;
        const newContent = JSON.parse(JSON.stringify(prev));

        let arrayToModify = newContent[section];
        const pathParts = fieldPath.split('.');
        
        let schemaArray;

        if (pathParts.length === 1 && Array.isArray(arrayToModify)) {
            schemaArray = cmsSchema.find(s=>s.page === page && s.section === section)?.data
        } else {
            let schemaData: any = cmsSchema.find(s=>s.page === page && s.section === section)?.data
            if (schemaData){
              for(let i=0; i<pathParts.length; i++){
                  if(schemaData[pathParts[i]] !== undefined) {
                    schemaData = schemaData[pathParts[i]];
                  }
              }
            }
             let parent = newContent[section];
             for(let i=0; i<pathParts.length; i++){
                if(parent[pathParts[i]] !== undefined){
                  parent = parent[pathParts[i]];
                }
             }
             arrayToModify = parent;
            schemaArray = schemaData;
        }
        
        if (!Array.isArray(arrayToModify)) return newContent;
        
        const template = schemaArray?.[0];
        if (!template) return newContent;

        const newItem = Object.keys(template).reduce((acc, key) => {
            if (key === 'id') acc[key] = String(Date.now());
            else if (key === 'keywords') acc[key] = [''];
            else acc[key] = '';
            return acc;
        }, {} as any);

        arrayToModify.push(newItem);
       
        return newContent;
    });
    toast({ title: "Item Added", description: "Click 'Save Section' to commit the new item." });
  };
  
  const handleDeleteItem = (page: PageName, section: string, fieldPath: string, index: number) => {
    let setContent;
    if (page === 'home') setContent = setHomeContent;
    else if (page === 'about') setContent = setAboutContent;
    else setContent = setContactContent;
    
    setContent(prev => {
       if (!prev) return null;
        const newContent = JSON.parse(JSON.stringify(prev));

        let arrayToModify = newContent[section];
        const pathParts = fieldPath.split('.');
        if (pathParts.length === 1 && Array.isArray(arrayToModify)) {
             // It's a root array
        } else {
            let parent = newContent[section];
            for(let i=0; i<pathParts.length-1; i++){
                parent = parent[pathParts[i]];
            }
            arrayToModify = parent[pathParts[pathParts.length - 1]];
        }
       
       if (!Array.isArray(arrayToModify)) return newContent;

       arrayToModify.splice(index, 1);
       return newContent;
    });
    toast({ title: "Item Removed", description: "Click 'Save Section' to commit the deletion." });
  };

  const handleSaveSection = async (page: PageName, section: string) => {
    if (!token) return;
    setIsSaving(`${page}-${section}`);
    
    let contentToSave;
    if (page === 'home') contentToSave = homeContent?.[section];
    else if (page === 'about') contentToSave = aboutContent?.[section];
    else contentToSave = contactContent?.[section];
    
    if (contentToSave === undefined) return;

    try {
      const response = await authFetch(`/api/cms/${page}/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: contentToSave }),
      });
      if (!response.ok) throw new Error(`Failed to save section: ${section}`);
      
      toast({ title: 'Success', description: `Section "${section}" saved successfully.` });
      await fetchAllContent();
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
       }
    } finally {
      setIsSaving(null);
    }
  };

  const handleSaveThemeSettings = async () => {
    if (!token || !themeSettings) return;
    setIsSaving('theme-settings');
    
    try {
      const response = await authFetch('/api/cms/home/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: themeSettings }),
      });
      if (!response.ok) throw new Error('Failed to save theme settings');
      
      toast({ title: 'Success', description: 'Theme settings saved successfully.' });
      await fetchAllContent();
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    } finally {
      setIsSaving(null);
    }
  };

  const handleThemeChange = (field: keyof ThemeSettings, value: any) => {
    setThemeSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  const renderField = (page: PageName, section: string, key: string, value: any, index?: number, parentPath?: string) => {
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;
      const fieldName = key.split('.').pop() || key;
      const fieldId = `${page}-${section}-${index !== undefined ? index : ''}-${fieldPath}`;
      
      const lowerFieldName = fieldName.toLowerCase();
      const imageKeys = ['image', 'image1', 'image2', 'imageurl', 'photourl', 'avatarurl', 'thumbnailurl', 'icon', 'logourl', 'beforeimageurl', 'afterimageurl'];
      const videoKeys = ['videourl'];
      const isImageField = imageKeys.includes(lowerFieldName);
      const isVideoField = videoKeys.includes(lowerFieldName);
      
      const sizeHintKey = `${page}-${section}-${fieldName.toLowerCase()}`;
      const sizeHint = imageSizeHints[sizeHintKey];
      const isDescriptionField = ['description', 'text', 'overview', 'vision', 'bio', 'copyright'].includes(fieldName.toLowerCase());
      const isTeamMemberSeoField = section === 'teamMembers' && ['title', 'keywords', 'slug'].includes(fieldName.toLowerCase());
      const isTeamMemberDescription = section === 'teamMembers' && fieldName.toLowerCase() === 'description';
      const isSeoKeywords = isTeamMemberSeoField && fieldName.toLowerCase() === 'keywords';
      const isSeoTitle = isTeamMemberSeoField && fieldName.toLowerCase() === 'title';
      const isSeoSlug = isTeamMemberSeoField && fieldName.toLowerCase() === 'slug';
      const isShortDescription = section === 'teamMembers' && fieldName.toLowerCase() === 'short_description';
      const isUrlField = ['mapembedurl', 'url'].includes(lowerFieldName);

      const isValidUrl = (url: unknown): url is string => {
        return typeof url === 'string' && (url.startsWith('/') || url.startsWith('http'));
      };

      if (isVideoField) {
        const uploadKey = `${page}-${section}-${fieldPath}-${index ?? 'root'}`;
        const isUploading = uploadingVideo === uploadKey;
        
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="capitalize">{fieldName.replace(/_/g, ' ')}</Label>
            <Input
              id={fieldId}
              type="file"
              accept="video/*"
              onChange={(e) => handleVideoFileChange(e, page, section, fieldPath, index)}
              disabled={!can('edit', pathname) || isUploading}
            />
            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
                <p className="text-sm text-muted-foreground">Uploading video...</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Upload a video file (MP4, MOV, AVI, etc.)</p>
            {isValidUrl(value) && (
              <div className="mt-2 p-2 border rounded-md bg-muted">
                <video 
                  src={getAssetUrl(value)} 
                  controls 
                  className="w-full max-w-xs max-h-24 object-contain"
                >
                  Your browser does not support the video tag.
                </video>
                <p className="text-xs text-muted-foreground mt-1">Current video: {value}</p>
              </div>
            )}
          </div>
        );
      }

      if (isImageField) {
        const labelText = fieldName.replace(/_/g, ' ');
        const labelWithSize = sizeHint ? `${labelText} (${sizeHint.replace('Required: ', '')})` : labelText;
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="capitalize">{labelWithSize}</Label>
            <div className="flex items-center gap-2">
              <Input
                value={value || ''}
                onChange={(e) => handleFieldChange(page, section, fieldPath, e.target.value, index)}
                placeholder="Enter image URL or upload"
                disabled={!can('edit', pathname)}
                className="flex-1"
              />
              <input
                type="file"
                accept="image/*,.svg"
                onChange={(e) => handleFileChange(e, page, section, fieldPath, index)}
                disabled={!can('edit', pathname)}
                className="hidden"
                id={`${fieldId}-upload`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => document.getElementById(`${fieldId}-upload`)?.click()}
                disabled={!can('edit', pathname)}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {sizeHint && <p className="text-xs text-muted-foreground">{sizeHint}</p>}
            {isValidUrl(value) && (
              <Card className="p-2 w-24 h-24 flex items-center justify-center bg-muted inline-block">
                <Image 
                  src={getAssetUrl(value)} 
                  alt="Preview" 
                  width={80} 
                  height={80} 
                  className="object-cover rounded" 
                />
              </Card>
            )}
          </div>
        );
      }

      if (isTeamMemberDescription) {
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="font-medium">Full Description (Rich Text)</Label>
            <RichTextEditor
              value={value || ''}
              onChange={(val) => handleFieldChange(page, section, fieldPath, val, index)}
              disabled={!can('edit', pathname)}
              placeholder="Enter detailed professional biography..."
            />
            <p className="text-xs text-muted-foreground">Full professional description with rich text formatting</p>
          </div>
        );
      }
      
      if (isShortDescription) {
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="font-medium">Short Description</Label>
            <MagicTextarea
              id={fieldId}
              value={value}
              onValueChange={(val) => handleFieldChange(page, section, fieldPath, val, index)}
              rows={2}
              aiContext={`A brief professional summary for a healthcare professional.`}
              disabled={!can('edit', pathname)}
            />
            <p className="text-xs text-muted-foreground">Brief summary for cards and previews</p>
          </div>
        );
      }
      
      if (isSeoKeywords) {
        const keywordsString = Array.isArray(value) ? value.join(', ') : value || '';
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="font-medium">SEO Keywords</Label>
            <Input
              id={fieldId}
              value={keywordsString}
              onChange={(e) => {
                const keywordsArray = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                handleFieldChange(page, section, fieldPath, keywordsArray, index);
              }}
              placeholder="keyword1, keyword2, keyword3"
              disabled={!can('edit', pathname)}
            />
            <p className="text-xs text-muted-foreground">Comma-separated keywords for search optimization</p>
          </div>
        );
      }
      
      if (isSeoSlug) {
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="font-medium">URL Slug</Label>
            <Input
              id={fieldId}
              value={value}
              onChange={(e) => {
                const slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                handleFieldChange(page, section, fieldPath, slug, index);
              }}
              placeholder="doctor-name-slug"
              disabled={!can('edit', pathname)}
            />
            <p className="text-xs text-muted-foreground">URL-friendly version of the name (auto-formatted)</p>
          </div>
        );
      }
      
      if (isSeoTitle) {
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="font-medium">SEO Page Title</Label>
            <Input
              id={fieldId}
              value={value}
              onChange={(e) => handleFieldChange(page, section, fieldPath, e.target.value, index)}
              placeholder="Professional title for search engines"
              disabled={!can('edit', pathname)}
            />
            <p className="text-xs text-muted-foreground">Title tag for search engines (50-60 characters recommended)</p>
          </div>
        );
      }

      if (typeof value === 'string' && isDescriptionField) {
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="capitalize">{fieldName.replace(/_/g, ' ')}</Label>
            <MagicTextarea
              id={fieldId}
              value={value}
              onValueChange={(val) => handleFieldChange(page, section, fieldPath, val, index)}
              rows={4}
              aiContext={`A website ${fieldName.replace(/_/g, ' ')} for a healthcare clinic.`}
              disabled={!can('edit', pathname)}
            />
          </div>
        );
      }
      
      if (typeof value === 'string' && (isUrlField || fieldName.toLowerCase() === 'address')) {
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="capitalize">{fieldName.replace(/_/g, ' ')}</Label>
            <Textarea
              id={fieldId}
              value={value}
              onChange={(e) => handleFieldChange(page, section, fieldPath, e.target.value, index)}
              rows={4}
              disabled={!can('edit', pathname)}
            />
          </div>
        );
      }
      
      if (typeof value === 'number' && fieldName.toLowerCase() === 'rating') {
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="capitalize">{fieldName.replace(/_/g, ' ')}</Label>
            <Select value={String(value)} onValueChange={(val) => handleFieldChange(page, section, fieldPath, Number(val), index)} disabled={!can('edit', pathname)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Star</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      }
      
      if (typeof value === 'number') {
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="capitalize">{fieldName.replace(/_/g, ' ')}</Label>
            <Input
              id={fieldId}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(page, section, fieldPath, Number(e.target.value), index)}
              disabled={!can('edit', pathname)}
            />
          </div>
        );
      }
      
      if (typeof value === 'string') {
           return (
            <div className="space-y-2">
              <Label htmlFor={fieldId} className="capitalize">{fieldName.replace(/_/g, ' ')}</Label>
              <Input
                id={fieldId}
                value={value}
                onChange={(e) => handleFieldChange(page, section, fieldPath, e.target.value, index)}
                disabled={!can('edit', pathname)}
              />
            </div>
          );
      }

      return null;
  };
  
  const renderSection = (page: PageName, section: string) => {
      let content;
      if (page === 'home') content = homeContent;
      else if (page === 'about') content = aboutContent;
      else content = contactContent;

      if (!content || content[section] === undefined) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div>;

      const data = content[section];

      const renderObject = (obj: any, pathPrefix = '') => {
        return Object.entries(obj).map(([key, value]) => {
           const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;
           if (key === 'id') return null;

           if (Array.isArray(value)) {
               return (
                  <div key={currentPath} className="space-y-4 pt-4 border-t mt-4">
                      <h3 className="capitalize font-semibold">{key.replace(/_/g, ' ')}</h3>
                      {value.map((item, index) => (
                           <Card key={item.id || index} className="p-4">
                             <div className="flex justify-between items-center mb-4">
                                <CardTitle className="text-base">Item {index + 1}</CardTitle>
                                {can('edit', pathname) && (
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(page, section, currentPath, index)}>
                                        <Trash2 className="h-4 w-4"/>
                                        <span className="sr-only">Delete Item</span>
                                    </Button>
                                )}
                             </div>
                             <div className="space-y-4">
                                {typeof item === 'object' && item !== null ? Object.entries(item).map(([itemKey, itemValue]) => {
                                    if (itemKey === 'id') return null;
                                    return <div key={itemKey} className="space-y-4">{renderField(page, section, `${key}.${itemKey}`, itemValue, index, pathPrefix)}</div>;
                                }) : renderField(page, section, key, item, index, pathPrefix) }
                             </div>
                           </Card>
                      ))}
                      {can('edit', pathname) && (
                       <Button variant="outline" onClick={() => handleAddItem(page, section, currentPath)}>
                          <PlusCircle className="h-4 w-4 mr-2"/> Add New Item to {key.replace(/_/g, ' ')}
                      </Button>
                      )}
                  </div>
               )
           }

           if (typeof value === 'object' && value !== null) {
              return (
                <div key={currentPath} className="space-y-4 pt-4 border-t mt-4">
                  <h3 className="capitalize font-semibold">{key.replace(/_/g, ' ')}</h3>
                  {renderObject(value, currentPath)}
                </div>
              );
           }
           
           return <div key={currentPath} className="space-y-4">{renderField(page, section, key, value, undefined, pathPrefix)}</div>
        });
      };
      
      if(Array.isArray(data)) {
        return (
            <div className="space-y-4 pt-4">
                {data.map((item, index) => (
                     <Card key={item.id || index} className="p-4">
                       <div className="flex justify-between items-center mb-4">
                          <CardTitle className="text-base">Item {index + 1}</CardTitle>
                          {can('edit', pathname) && (
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(page, section, section, index)}>
                              <Trash2 className="h-4 w-4"/>
                              <span className="sr-only">Delete Item</span>
                          </Button>
                          )}
                       </div>
                       <div className="space-y-4">
                          {Object.entries(item).map(([key, value]) => {
                              if (key === 'id') return null;
                              return <div key={key} className="space-y-4">{renderField(page, section, key, value, index)}</div>;
                          })}
                       </div>
                     </Card>
                ))}
                {can('edit', pathname) && (
                 <Button variant="outline" onClick={() => handleAddItem(page, section, section)}>
                    <PlusCircle className="h-4 w-4 mr-2"/> Add New Item
                </Button>
                )}
            </div>
         )
      }

      return <div className="space-y-4">{renderObject(data)}</div>;
  }


  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
     return <Card><CardContent className="p-4">You do not have permission to view this page.</CardContent></Card>
  }

  if (!homeContent || !aboutContent || !contactContent || !themeSettings) {
    return <Card><CardContent className="p-4">Could not load content. Please try refreshing the page.</CardContent></Card>;
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[80vh]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website Content</h1>
          <p className="text-muted-foreground">Manage the content for your public-facing website.</p>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', value);
        window.history.replaceState({}, '', url.toString());
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="home">Home Page</TabsTrigger>
          <TabsTrigger value="about">About Page</TabsTrigger>
          <TabsTrigger value="contact">Contact Page</TabsTrigger>
          <TabsTrigger value="theme">Theme Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="home">
            <Accordion type="multiple" className="w-full space-y-2">
                {Object.keys(homeContent).map(section => (
                    <AccordionItem value={section} key={`home-${section}`} className="border-b-0">
                      <Card className="overflow-hidden">
                        <AccordionTrigger className="capitalize text-lg py-0 px-4 hover:no-underline bg-muted/50">
                           <div className="py-4">{section.replace(/([A-Z])/g, ' $1')}</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 border-t">
                           {renderSection('home', section)}
                           {can('edit', pathname) && (
                           <Button className="mt-6" onClick={() => handleSaveSection('home', section)} disabled={isSaving === `home-${section}`}>
                                {isSaving === `home-${section}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2" />}
                                Save Section
                           </Button>
                           )}
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                ))}
            </Accordion>
        </TabsContent>
        <TabsContent value="about">
             <Accordion type="multiple" className="w-full space-y-2">
                {Object.keys(aboutContent).map(section => (
                     <AccordionItem value={section} key={`about-${section}`} className="border-b-0">
                      <Card className="overflow-hidden">
                        <AccordionTrigger className="capitalize text-lg py-0 px-4 hover:no-underline bg-muted/50">
                           <div className="py-4">{section.replace(/([A-Z])/g, ' $1')}</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 border-t">
                           {renderSection('about', section)}
                           {can('edit', pathname) && (
                           <Button className="mt-6" onClick={() => handleSaveSection('about', section)} disabled={isSaving === `about-${section}`}>
                                {isSaving === `about-${section}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2" />}
                                Save Section
                           </Button>
                           )}
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                ))}
            </Accordion>
        </TabsContent>
         <TabsContent value="contact">
             <Accordion type="multiple" className="w-full space-y-2">
                {Object.keys(contactContent).map(section => (
                     <AccordionItem value={section} key={`contact-${section}`} className="border-b-0">
                      <Card className="overflow-hidden">
                        <AccordionTrigger className="capitalize text-lg py-0 px-4 hover:no-underline bg-muted/50">
                           <div className="py-4">{section.replace(/([A-Z])/g, ' $1')}</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 border-t">
                           {renderSection('contact', section)}
                           {can('edit', pathname) && (
                           <Button className="mt-6" onClick={() => handleSaveSection('contact', section)} disabled={isSaving === `contact-${section}`}>
                                {isSaving === `contact-${section}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2" />}
                                Save Section
                           </Button>
                           )}
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                ))}
            </Accordion>
        </TabsContent>
        <TabsContent value="theme">
          <div className="space-y-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold leading-none tracking-tight">UI Variant</CardTitle>
                <CardDescription>Select the layout and component style for the entire site.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex gap-4">
                {themeSettings.availableVersions.map((version) => (
                  <Button
                    key={version.name}
                    variant={themeSettings.version === version.name ? "default" : "outline"}
                    className="h-10 text-lg px-6 py-6 flex flex-col gap-1"
                    onClick={() => handleThemeChange('version', version.name)}
                    disabled={!can('edit', pathname)}
                  >
                    <span className="font-bold">{version.name.toUpperCase()}</span>
                    <span className="text-xs opacity-80">{version.label}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold leading-none tracking-tight">Color Palette</CardTitle>
                <CardDescription>Choose a global color scheme. This will apply to all UI variants.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {themeSettings.availablePalettes.map((palette) => {
                  const isSelected = themeSettings.colorPalette === palette.name;
                  return (
                    <div key={palette.name} className="space-y-2">
                      <Button
                        variant="ghost"
                        className={`w-full h-24 rounded-lg border-2 flex items-center justify-center p-0 relative ${
                          isSelected ? 'border-primary ring-2 ring-primary' : 'border-muted'
                        }`}
                        onClick={() => handleThemeChange('colorPalette', palette.name)}
                        disabled={!can('edit', pathname)}
                      >
                        <div 
                          className="h-16 w-16 rounded-full border border-border"
                          style={{
                            background: `linear-gradient(to right, ${palette.colors[0]} 50%, ${palette.colors[1]} 50%)`
                          }}
                        />
                        {isSelected && (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="h-8 w-8 text-white absolute"
                            style={{ textShadow: 'black 0px 0px 5px' }}
                          >
                            <path d="M20 6 9 17l-5-5"></path>
                          </svg>
                        )}
                      </Button>
                      <p className="text-center text-sm font-medium capitalize">{palette.name}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex justify-end mt-8">
              {can('edit', pathname) && (
                <Button 
                  onClick={handleSaveThemeSettings} 
                  disabled={isSaving === 'theme-settings'}
                  className="h-11 rounded-md px-8"
                >
                  {isSaving === 'theme-settings' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </Suspense>
  );
}




