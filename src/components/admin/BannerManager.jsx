"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { storage } from "@/lib/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Eye, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const API = process.env.NEXT_PUBLIC_API_URL;

const EMPTY_BANNER = {
  imageUrl: "",
  ctaText: "Learn More",
  ctaLink: "",
  ctaColor: "#f97316",
  ctaTextColor: "#ffffff",
  order: 0,
  active: true,
};

export default function BannerManager() {
  const { user } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [form, setForm] = useState(EMPTY_BANNER);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API}/api/banners`);
      const data = await res.json();
      if (data.success) setBanners(data.data);
    } catch {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be under 3MB");
      return;
    }
    setUploading("image");
    try {
      const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!form.imageUrl) return toast.error("Please upload a banner image");
    if (!form.ctaLink) return toast.error("CTA link is required");

    setSaving("saving");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API}/api/admin/banners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          ...form,
          order: editingId ? form.order : banners.length,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Banner updated" : "Banner added");
        fetchBanners();
        resetForm();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this banner?")) return;
    setDeleting(id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API}/api/admin/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Banner deleted");
        fetchBanners();
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const token = await user.getIdToken();
      await fetch(`${API}/api/admin/banners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: banner.id, active: !banner.active }),
      });
      fetchBanners();
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const startEdit = (banner) => {
    setForm({
      imageUrl: banner.imageUrl,
      ctaText: banner.ctaText,
      ctaLink: banner.ctaLink,
      ctaColor: banner.ctaColor,
      ctaTextColor: banner.ctaTextColor,
      order: banner.order,
      active: banner.active,
    });
    setEditingId(banner.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm(EMPTY_BANNER);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Banner Manager</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage gift card page banners. Max 5. Recommended: 1200×300px
          </p>
        </div>
        {!showForm && banners.length < 5 && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Banner
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow p-6 mb-8">
          <h2 className="text-lg font-black text-gray-900 mb-5">
            {editingId ? "Edit Banner" : "New Banner"}
          </h2>

          <div className="space-y-5">
            {/* Image Upload */}
            <div>
              <Label className="font-semibold text-gray-700 block mb-2">
                Banner Image{" "}
                <span className="text-gray-400 font-normal">
                  (1200×300px recommended, max 3MB)
                </span>
              </Label>
              {form.imageUrl && (
                <div className="relative mb-3 rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={form.imageUrl}
                    alt="Banner preview"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading === "image"}
                className="w-full border-dashed"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading === "image"
                  ? "Uploading..."
                  : form.imageUrl
                    ? "Replace Image"
                    : "Upload Image"}
              </Button>
            </div>

            {/* CTA Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold text-gray-700 mb-1 block">
                  CTA Button Text
                </Label>
                <Input
                  value={form.ctaText}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ctaText: e.target.value }))
                  }
                  placeholder="e.g. Shop Now, Learn More"
                />
              </div>
              <div>
                <Label className="font-semibold text-gray-700 mb-1 block">
                  CTA Link
                </Label>
                <Input
                  value={form.ctaLink}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ctaLink: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold text-gray-700 mb-1 block">
                  Button Background Color
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.ctaColor}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, ctaColor: e.target.value }))
                    }
                    className="h-10 w-16 rounded-lg border border-gray-200 cursor-pointer p-1"
                  />
                  <Input
                    value={form.ctaColor}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, ctaColor: e.target.value }))
                    }
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="font-semibold text-gray-700 mb-1 block">
                  Button Text Color
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.ctaTextColor}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, ctaTextColor: e.target.value }))
                    }
                    className="h-10 w-16 rounded-lg border border-gray-200 cursor-pointer p-1"
                  />
                  <Input
                    value={form.ctaTextColor}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, ctaTextColor: e.target.value }))
                    }
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Live CTA Preview */}
            <div>
              <Label className="font-semibold text-gray-700 mb-2 block">
                Button Preview
              </Label>
              <button
                type="button"
                style={{
                  backgroundColor: form.ctaColor,
                  color: form.ctaTextColor,
                }}
                className="px-6 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              >
                {form.ctaText || "Button"}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving === "saving"}
                className="bg-blue-900 hover:bg-blue-800 text-white flex-1"
              >
                {saving === "saving"
                  ? "Saving..."
                  : editingId
                    ? "Update Banner"
                    : "Add Banner"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Banner List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          No banners yet. Add your first one.
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                banner.active ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              {/* Banner Image */}
              <div className="relative">
                <img
                  src={banner.imageUrl}
                  alt="Banner"
                  className="w-full h-24 object-cover"
                />
                {/* CTA overlay preview */}
                <div className="absolute bottom-3 right-3">
                  <span
                    style={{
                      backgroundColor: banner.ctaColor,
                      color: banner.ctaTextColor,
                    }}
                    className="px-4 py-1.5 rounded-lg font-bold text-xs shadow"
                  >
                    {banner.ctaText}
                  </span>
                </div>
                {!banner.active && (
                  <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
                    <Badge className="bg-gray-800 text-white">Hidden</Badge>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <div className="text-sm">
                  <span className="text-gray-400">→ </span>
                  <span className="text-gray-600 truncate max-w-[200px] inline-block align-bottom">
                    {banner.ctaLink}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition"
                    title={banner.active ? "Hide banner" : "Show banner"}
                  >
                    {banner.active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(banner)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(banner.id)}
                    disabled={deleting === banner.id}
                    className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
