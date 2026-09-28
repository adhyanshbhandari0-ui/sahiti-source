import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2, Upload } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Business profile | Sahiti" },
      {
        name: "description",
        content:
          "Keep your business details, milestones and business photographs up to date in your private Sahiti profile.",
      },
      { property: "og:title", content: "Sahiti business profile" },
      { property: "og:description", content: "Business details, milestones and photographs." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function Profile() {
  const { user } = useSession();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    display_name: "",
    business_name: "",
    description: "",
    category: "Retail",
    pincode: "411047",
    block: "Lohegaon",
    district: "Pune",
    monthly_revenue_range: "Not provided",
    employees: 0,
    whatsapp: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [milestone, setMilestone] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: ["profile-page", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [profile, images, milestones] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase
          .from("business_images")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("milestones")
          .select("*")
          .eq("user_id", user!.id)
          .order("achieved_on", { ascending: false }),
      ]);
      const list = images.data ?? [];
      const signed = await Promise.all(
        list.map(async (image) => {
          const { data: url } = await supabase.storage
            .from("business-images")
            .createSignedUrl(image.storage_path, 3600);
          return { ...image, url: url?.signedUrl ?? "" };
        }),
      );
      return { profile: profile.data, images: signed, milestones: milestones.data ?? [] };
    },
  });

  useEffect(() => {
    if (data?.profile) {
      setForm({
        display_name: data.profile.display_name,
        business_name: data.profile.business_name,
        description: data.profile.description,
        category: data.profile.category,
        pincode: data.profile.pincode,
        block: data.profile.block,
        district: data.profile.district,
        monthly_revenue_range: data.profile.monthly_revenue_range,
        employees: data.profile.employees,
        whatsapp: data.profile.whatsapp ?? "",
        email: data.profile.email ?? "",
      });
    }
  }, [data?.profile]);

  async function save() {
    setError("");
    if (form.display_name.trim().length < 3 || form.display_name.trim().length > 100) {
      setError(t("profileErrName"));
      return;
    }
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) {
      setError(t("profileErrPincode"));
      return;
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ...form,
        employees: Number(form.employees) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user!.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile-page", user?.id] });
    toast.success(t("profileSavedToast"));
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("profileErrImage"));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error(t("profileErrSize"));
      return;
    }
    setUploading(true);
    const path = `${user!.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("business-images")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setUploading(false);
      toast.error(uploadError.message);
      return;
    }
    await supabase.from("business_images").insert({ user_id: user!.id, storage_path: path });
    setUploading(false);
    await queryClient.invalidateQueries({ queryKey: ["profile-page", user?.id] });
    toast.success(t("profilePhotoUploaded"));
  }

  async function removeImage(id: string, path: string) {
    await supabase.storage.from("business-images").remove([path]);
    await supabase.from("business_images").delete().eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["profile-page", user?.id] });
  }

  async function addMilestone() {
    const title = milestone.trim();
    if (title.length < 2) return;
    await supabase.from("milestones").insert({ user_id: user!.id, title: title.slice(0, 120) });
    setMilestone("");
    await queryClient.invalidateQueries({ queryKey: ["profile-page", user?.id] });
  }

  return (
    <>
      <PageHeader title={t("profileTitle")} description={t("profileDescription")} />

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-md border p-5">
          <h2 className="text-base font-semibold">{t("profileDetailsTitle")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              id="display_name"
              label={t("profileYourName")}
              value={form.display_name}
              onChange={(v) => setForm({ ...form, display_name: v })}
            />
            <Field
              id="business_name"
              label={t("profileBusinessName")}
              value={form.business_name}
              onChange={(v) => setForm({ ...form, business_name: v })}
            />
            <Field
              id="category"
              label={t("profileCategory")}
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
            />
            <Field
              id="monthly_revenue_range"
              label={t("profileRevenueRange")}
              value={form.monthly_revenue_range}
              onChange={(v) => setForm({ ...form, monthly_revenue_range: v })}
            />
            <Field
              id="block"
              label={t("profileBlock")}
              value={form.block}
              onChange={(v) => setForm({ ...form, block: v })}
            />
            <Field
              id="district"
              label={t("profileDistrict")}
              value={form.district}
              onChange={(v) => setForm({ ...form, district: v })}
            />
            <Field
              id="pincode"
              label={t("profilePincode")}
              value={form.pincode}
              onChange={(v) => setForm({ ...form, pincode: v.replace(/[^\d]/g, "").slice(0, 6) })}
            />
            <Field
              id="employees"
              label={t("profileEmployees")}
              value={String(form.employees)}
              onChange={(v) =>
                setForm({ ...form, employees: Number(v.replace(/[^\d]/g, "")) || 0 })
              }
            />
            <Field
              id="whatsapp"
              label={t("profileWhatsapp")}
              value={form.whatsapp}
              onChange={(v) => setForm({ ...form, whatsapp: v })}
            />
            <Field
              id="email"
              label={t("profileEmail")}
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="description">{t("profileWhatDoes")}</Label>
            <Textarea
              id="description"
              className="mt-2 bg-muted"
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>
          {error && (
            <p role="alert" className="mt-3 text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <Button className="mt-4" onClick={() => void save()}>
            {t("profileSave")}
          </Button>
        </section>

        <div className="space-y-8">
          <section className="rounded-md border p-5">
            <h2 className="text-base font-semibold">{t("profilePhotosTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("profilePhotosHint")}</p>
            <Label
              htmlFor="photo"
              className="mt-4 flex cursor-pointer items-center justify-center gap-2 border border-dashed p-5 text-sm font-medium"
            >
              <Upload aria-hidden="true" className="size-4" />
              {uploading ? t("profileUploading") : t("profileChoosePhoto")}
            </Label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => void upload(e)}
            />
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {(data?.images ?? []).map((image) => (
                <li key={image.id} className="relative">
                  <img
                    src={image.url}
                    alt={image.caption || t("profilePhotoAlt")}
                    className="h-32 w-full object-cover"
                  />
                  <Button
                    className="absolute right-1 top-1"
                    size="icon"
                    variant="secondary"
                    aria-label={t("profileDeletePhoto")}
                    onClick={() => void removeImage(image.id, image.storage_path)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
            {(data?.images ?? []).length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">{t("profileNoPhotos")}</p>
            )}
          </section>

          <section className="rounded-md border p-5">
            <h2 className="text-base font-semibold">{t("profileMilestonesTitle")}</h2>
            <div className="mt-3 flex gap-2">
              <Input
                className="bg-muted"
                aria-label={t("profileMilestone")}
                value={milestone}
                onChange={(event) => setMilestone(event.target.value)}
                placeholder={t("profileMilestonePlaceholder")}
              />
              <Button onClick={() => void addMilestone()}>{t("profileAdd")}</Button>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {(data?.milestones ?? []).map((item) => (
                <li key={item.id} className="flex justify-between border-b pb-2">
                  <span>{item.title}</span>
                  <span className="text-muted-foreground">{item.achieved_on}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="mt-2 bg-muted"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
