import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from './UI';
import { Camera, Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { IncidentReport } from '../types';

interface IncidentReportFormProps {
  onClose: () => void;
  userId?: string;
  userName?: string;
}

export const IncidentReportForm: React.FC<IncidentReportFormProps> = ({ onClose, userId, userName }) => {
  const [formData, setFormData] = useState({
    name: userName || '',
    placeType: '', // 'ward', 'clinic', 'general'
    place: '',
    otherPlace: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [places, setPlaces] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);
  const [clinics, setClinics] = useState<string[]>([]);

  useEffect(() => {
    // Fetch and categorize departments
    const fetchPlaces = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        
        // Categorize departments based on their names
        const wardList: string[] = [];
        const clinicList: string[] = [];
        
        data.departments.forEach((dept: any) => {
          const name = dept.NameEn || dept.NameAr;
          const nameLower = name.toLowerCase();
          
          // Common ward indicators
          if (nameLower.includes('ward') || nameLower.includes('قسم') || 
              nameLower.includes('internal') || nameLower.includes('surgical') ||
              nameLower.includes('icu') || nameLower.includes('emergency')) {
            wardList.push(name);
          }
          // Common clinic indicators  
          else if (nameLower.includes('clinic') || nameLower.includes('عيادة') ||
                   nameLower.includes('cardiology') || nameLower.includes('neurology') ||
                   nameLower.includes('pediatrics') || nameLower.includes('obstetrics')) {
            clinicList.push(name);
          }
        });
        
        setWards([...new Set(wardList)].sort());
        setClinics([...new Set(clinicList)].sort());
        setPlaces([...new Set(data.departments.map((d: any) => d.NameEn || d.NameAr))].sort());
      } catch (err) {
        console.error('Failed to fetch places:', err);
      }
    };
    fetchPlaces();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    const newImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        continue;
      }

      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(file);
      const base64 = await promise;
      newImages.push(base64);
    }

    setImages(prev => [...prev, ...newImages].slice(0, 5)); // Limit to 5 images
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.place || !formData.note || !formData.date) {
      setError('Please fill all mandatory fields');
      return;
    }

    if (formData.place === 'Other' && !formData.otherPlace) {
      setError('Please specify the place');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create the incident report first to get the ID
      const incidentReport: IncidentReport = {
        IncidentID: `INC_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        Date: formData.date,
        Name: formData.name,
        Place: formData.place === 'Other' ? formData.otherPlace : formData.place,
        Note: formData.note,
        Images: [], // Will be updated after image upload
        Status: 'Pending',
        CreatedAt: new Date().toISOString(),
        ReportedBy: userId
      };

      // Create incident first
      const createRes = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentReport)
      });
      
      const createData = await createRes.json();
      if (!createRes.ok || createData.error) throw new Error(createData.error || 'Failed to create incident');

      // 2. Upload images if any, using the new dedicated endpoint
      let uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        // Use the new dedicated endpoint that properly connects images to incidents
        for (let i = 0; i < images.length; i++) {
          const uploadRes = await fetch(`/api/incidents/${incidentReport.IncidentID}/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: images[i] })
          });
          const uploadData = await uploadRes.json();
          if (uploadData.error) throw new Error(uploadData.error);
          uploadedImageUrls.push(uploadData.imageUrl);
        }
        
        console.log(`Uploaded ${uploadedImageUrls.length} images for incident ${incidentReport.IncidentID}`);
      }

      // Success - incident was created (and images uploaded if any)
      setSuccess(true);
      // Signal other parts of the app that a new incident has been created
      window.dispatchEvent(new Event('incident:updated'));
      setTimeout(() => onClose(), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Report Submitted Successfully</h2>
          <p className="text-slate-500">Thank you for your report. We will investigate the issue and get back to you if needed.</p>
          <p className="text-sm text-slate-400">Closing in a few seconds...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full p-6 space-y-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle className="text-red-500" /> Report an Incident
          </h2>
          <p className="text-slate-500">Please provide details about the problem or incident.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date of Incident *"
              type="date"
              value={formData.date}
              onChange={(e: any) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Reporter Name *"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block text-right">Place / Location *</label>
            <select
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1B2B5B] focus:border-transparent outline-none transition-all text-slate-700"
              value={formData.place}
              onChange={(e) => setFormData({ ...formData, place: e.target.value })}
              required
            >
              <option value="">Select a Location</option>
              {places.map(place => (
                <option key={place} value={place}>{place}</option>
              ))}
              <option value="Other">Other (Please specify)</option>
            </select>
            
            {formData.place === 'Other' && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                <Input
                  label="Please Specify Place *"
                  placeholder="Enter the specific location"
                  value={formData.otherPlace}
                  onChange={(e: any) => setFormData({ ...formData, otherPlace: e.target.value })}
                  required={formData.place === 'Other'}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block text-right">Note / Description *</label>
            <textarea
              className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1B2B5B] focus:border-transparent outline-none transition-all text-slate-700 resize-none"
              placeholder="Describe what happened in detail..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              required
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700 block text-right">Upload Pictures (Optional)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                  <img src={img} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-[#1B2B5B] hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400 hover:text-[#1B2B5B]">
                  <Camera size={24} />
                  <span className="text-[10px] font-medium text-center px-2">Take Photo / Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
            <p className="text-[10px] text-slate-400">You can upload up to 5 images (Max 5MB each)</p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 h-12 font-bold bg-[#1B2B5B] hover:bg-[#152145]"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit Incident Report'
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              className="px-8"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
