"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider, useFieldArray, Controller, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import {
  initTelegramWebApp,
  getUser,
  getInitDataRaw,
  isTelegramWebApp,
  setBackButton,
  hideBackButton,
  setMainButton,
  hideMainButton,
  hapticFeedback,
} from "@/lib/telegram";

// Zod Schemas
const personalDataSchema = z.object({
  firstName: z.string().min(1, "Ism kiritilishi shart"),
  lastName: z.string().min(1, "Familiya kiritilishi shart"),
  birthDate: z.string().min(1, "Tug'ilgan sana kiritilishi shart"),
  gender: z.enum(["erkak", "ayol", "boshqa"]),
  maritalStatus: z.enum(["boydoq", "turmush", "ajrashgan", "beva"]),
  hasChildren: z.boolean(),
  childrenCount: z.string().optional(),
  childrenAges: z.string().optional(),
  citizenship: z.string().min(1, "Fuqarolik kiritilishi shart"),
  city: z.string().min(1, "Shahar kiritilishi shart"),
  region: z.string().min(1, "Viloyat kiritilishi shart"),
  phone: z.string().min(1, "Telefon kiritilishi shart").regex(/^\+?[1-9]\d{1,14}$/, "Telefon raqami noto'g'ri formatda. Misol: +998901234567 yoki +491511234567"),
  telegramOrPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

const interestAvailabilitySchema = z.object({
  interestedInGermany: z.boolean(),
  desiredJob: z.string().min(1, "Istalgan kasb kiritilishi shart"),
  availabilityType: z.enum(["now", "date"]),
  earliestDate: z.string().optional(),
});

const educationEntrySchema = z.object({
  degree: z.enum(["diplom_kollej", "diplom_texnikum", "bakalavr", "magistr", "doktorantura"]),
  periodFrom: z.string().min(1, "Boshlanish sanasi"),
  periodTo: z.string().min(1, "Tugash sanasi"),
  institution: z.string().min(1, "Muassasa"),
  fieldOfStudy: z.string().min(1, "Yo'nalish"),
});

const workExperienceEntrySchema = z.object({
  company: z.string().min(1, "Korxona"),
  periodFrom: z.string().min(1, "Boshlanish"),
  periodTo: z.string().min(1, "Tugash"),
  position: z.string().min(1, "Lavozim"),
  tasks: z.string().min(1, "Vazifalar"),
});

const languageLevelSchema = z.enum(["a1", "a2", "b1", "b2", "c1", "c2", "native"]);

const languageSkillsSchema = z.object({
  uzbekLevel: languageLevelSchema,
  russianLevel: languageLevelSchema,
  germanLevel: languageLevelSchema,
  englishLevel: languageLevelSchema,
  otherLanguageName: z.string().optional(),
  otherLanguageLevel: languageLevelSchema.optional(),
  hasGermanCertificate: z.boolean(),
  germanCertificateLevel: z.enum(["a1", "a2", "b1", "b2", "c1", "c2"]).optional(),
});

const driversLicenseSchema = z.object({
  hasLicense: z.boolean(),
  classes: z.array(z.enum(["a1", "a", "b", "be", "c", "ce", "d", "de", "tm", "tb"])),
});

const germanyExperienceSchema = z.object({
  hasExperience: z.boolean(),
  periodFrom: z.string().optional(),
  periodTo: z.string().optional(),
  activity: z.string().optional(),
});

const otherInfoSchema = z.object({
  certificates: z.string().optional(),
  motivation: z.string().optional(),
});

const consentSchema = z.object({
  agreed: z.boolean(),
  date: z.string(),
}).refine((data) => data.agreed === true, {
  message: "Rozilik bildirish majburiy / Einwilligung erforderlich",
  path: ["agreed"],
});

const formSchema = z.object({
  personal: personalDataSchema,
  interest: interestAvailabilitySchema,
  education: z.object({
    entries: z.array(educationEntrySchema).min(1),
  }),
  workExperience: z.object({
    entries: z.array(workExperienceEntrySchema),
  }),
  languages: languageSkillsSchema,
  driversLicense: driversLicenseSchema,
  germanyExperience: germanyExperienceSchema,
  otherInfo: otherInfoSchema,
  consent: consentSchema,
});

type FormData = z.infer<typeof formSchema>;

const TOTAL_STEPS = 9;

const defaultValues: FormData = {
  personal: {
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "erkak",
    maritalStatus: "boydoq",
    hasChildren: false,
    citizenship: "O'zbekiston",
    city: "",
    region: "",
    phone: "",
    telegramOrPhone: "",
    email: "",
  },
  interest: {
    interestedInGermany: true,
    desiredJob: "",
    availabilityType: "now",
  },
  education: {
    entries: [{ degree: "bakalavr", periodFrom: "", periodTo: "", institution: "", fieldOfStudy: "" }],
  },
  workExperience: {
    entries: [],
  },
  languages: {
    uzbekLevel: undefined as any,
    russianLevel: undefined as any,
    germanLevel: undefined as any,
    englishLevel: undefined as any,
    hasGermanCertificate: false,
  },
  driversLicense: {
    hasLicense: false,
    classes: [],
  },
  germanyExperience: {
    hasExperience: false,
  },
  otherInfo: {
    certificates: "",
    motivation: "",
  },
  consent: {
    agreed: false,
    date: new Date().toISOString().split("T")[0],
  },
};

const licenseClasses = ["a1", "a", "b", "be", "c", "ce", "d", "de", "tm", "tb"] as const;

const degreeOptions = [
  { value: "diplom_kollej", label: "Diplom Kollej" },
  { value: "diplom_texnikum", label: "Diplom Texnikum" },
  { value: "bakalavr", label: "Bakalavr" },
  { value: "magistr", label: "Magistr" },
  { value: "doktorantura", label: "Doktorantura" },
];

const languageLevelOptions = [
  { value: "a1", label: "A1" },
  { value: "a2", label: "A2" },
  { value: "b1", label: "B1" },
  { value: "b2", label: "B2" },
  { value: "c1", label: "C1" },
  { value: "c2", label: "C2" },
  { value: "native", label: "Ona tili / Muttersprache" },
];

export function RegistrationWizard({ leadId }: { leadId: string | null }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  const { control, handleSubmit, watch, trigger, formState: { errors } } = methods;

  const educationArray = useFieldArray({ control, name: "education.entries" });
  const workExperienceArray = useFieldArray({ control, name: "workExperience.entries" });

  useEffect(() => {
    initTelegramWebApp();
    setIsTelegram(isTelegramWebApp());
    const user = getUser();
    if (user) {
      methods.setValue("personal.firstName", user.first_name || "");
      methods.setValue("personal.lastName", user.last_name || "");
    }
  }, [methods]);

  useEffect(() => {
    if (!isTelegram) return;

    if (currentStep > 1) {
      setBackButton(() => handleBack());
    } else {
      hideBackButton();
    }

    if (currentStep === TOTAL_STEPS) {
      setMainButton("Yuborish / Absenden", () => {
        handleSubmit(onSubmit)();
      });
    } else {
      hideMainButton();
    }
  }, [currentStep, isTelegram]);

  const handleBack = () => {
    hapticFeedback("impact", "light");
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNext = async () => {
    const fieldsToValidate = getStepFields(currentStep);
    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid) {
      hapticFeedback("impact", "light");
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep((prev) => prev + 1);
      }
    } else {
      hapticFeedback("notification", "error");
    }
  };

  const getStepFields = (step: number): string[] => {
    switch (step) {
      case 1: return ["personal"];
      case 2: return ["interest"];
      case 3: return ["education"];
      case 4: return ["workExperience"];
      case 5: return ["languages"];
      case 6: return ["driversLicense"];
      case 7: return ["germanyExperience"];
      case 8: return ["otherInfo"];
      case 9: return ["consent"];
      default: return [];
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!leadId) {
        setSubmitError("Lead ID topilmadi. Iltimos, bot orqali qayta kiring.");
        hapticFeedback("notification", "error");
        setIsSubmitting(false);
        return;
      }

      const initData = getInitDataRaw();
      if (!initData) {
        setSubmitError("Telegram ma'lumotlari topilmadi. / Telegram-Daten nicht gefunden.");
        hapticFeedback("notification", "error");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(
        "https://ylnrrkkhuufnziuggwbg.supabase.co/functions/v1/submit-registration-form",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData, leadId, formData: data }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const msg = result.message || result.error || "Unknown error";
        setSubmitError(msg);
        hapticFeedback("notification", "error");
      } else {
        setSubmitSuccess(true);
        hapticFeedback("notification", "success");
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Tarmoq xatosi / Netzwerkfehler");
      hapticFeedback("notification", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Personal control={control} watch={watch} />;
      case 2:
        return <Step2Interest control={control} watch={watch} />;
      case 3:
        return <Step3Education control={control} fields={educationArray} />;
      case 4:
        return <Step4WorkExperience control={control} fields={workExperienceArray} />;
      case 5:
        return <Step5Languages control={control} watch={watch} />;
      case 6:
        return <Step6DriversLicense control={control} watch={watch} />;
      case 7:
        return <Step7GermanyExperience control={control} watch={watch} />;
      case 8:
        return <Step8OtherInfo control={control} />;
      case 9:
        return <Step9Consent control={control} watch={watch} />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{getStepTitle(currentStep)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderStep()}
              </CardContent>
            </Card>

            {submitSuccess ? (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-700 font-medium">
                Muvaffaqiyatli saqlandi! ✅
              </p>
              <p className="text-green-600 text-sm">
                Erfolgreich gespeichert!
              </p>
            </div>
          ) : (
            <>
              {submitError && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {submitError}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                    ← Orqaga / Zurück
                  </Button>
                )}
                {currentStep < TOTAL_STEPS ? (
                  <Button type="button" onClick={handleNext} className="flex-1">
                    Keyingi / Weiter →
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700">
                    {isSubmitting ? "Yuborilmoqda... / Wird gesendet..." : "Yuborish / Absenden"}
                  </Button>
                )}
              </div>
            </>
          )}
          </form>
        </div>
      </div>
    </FormProvider>
  );
}

function getStepTitle(step: number): string {
  const titles = [
    "Persönliche Daten ✓",  // Geändert für Test
    "Qiziqish va mavjudlik / Interesse & Verfügbarkeit",
    "Ta'lim va malaka / Bildung & Ausbildung",
    "Mehnat tajribasi / Berufserfahrung",
    "Til bilimlari / Sprachkenntnisse",
    "Haydovchilik guvohnomasi / Führerschein",
    "Germaniyada tajriba / Deutschland-Erfahrung",
    "Boshqa ma'lumotlar / Sonstiges",
    "Roziliknoma / Einwilligung",
  ];
  return titles[step - 1] || "";
}

// Step 1: Personal Data
function Step1Personal({ control, watch }: { control: any; watch: any }) {
  const hasChildren = watch("personal.hasChildren");
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Ism (Vorname) *</Label>
          <Controller
            name="personal.firstName"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Ism" />}
          />
        </div>
        <div>
          <Label>Familiya (Nachname) *</Label>
          <Controller
            name="personal.lastName"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Familiya" />}
          />
        </div>
      </div>

      <div>
        <Label>Tug'ilgan sana (Geburtsdatum) *</Label>
        <Controller
          name="personal.birthDate"
          control={control}
          render={({ field }) => <Input type="date" {...field} />}
        />
      </div>

      <div>
        <Label>Jinsi (Geschlecht) *</Label>
        <Controller
          name="personal.gender"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="erkak">Erkak (Männlich)</SelectItem>
                <SelectItem value="ayol">Ayol (Weiblich)</SelectItem>
                <SelectItem value="boshqa">Boshqa (Divers)</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div>
        <Label>Oilaviy holat (Familienstand) *</Label>
        <Controller
          name="personal.maritalStatus"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boydoq">Bo'ydoq (Ledig)</SelectItem>
                <SelectItem value="turmush">Turmush qurgan (Verheiratet)</SelectItem>
                <SelectItem value="ajrashgan">Ajrashgan (Geschieden)</SelectItem>
                <SelectItem value="beva">Beva (Verwitwet)</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="personal.hasChildren"
          control={control}
          render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label className="text-sm">Bolalar bor (Kinder vorhanden)</Label>
      </div>

      {hasChildren && (
        <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-border">
          <div>
            <Label>Soni (Anzahl)</Label>
            <Controller
              name="personal.childrenCount"
              control={control}
              render={({ field }) => <Input {...field} placeholder="Masalan: 2" />}
            />
          </div>
          <div>
            <Label>Yoshi (Alter)</Label>
            <Controller
              name="personal.childrenAges"
              control={control}
              render={({ field }) => <Input {...field} placeholder="Masalan: 5, 8" />}
            />
          </div>
        </div>
      )}

      <div>
        <Label>Fuqarolik (Staatsangehörigkeit) *</Label>
        <Controller
          name="personal.citizenship"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Shahar (Stadt) *</Label>
          <Controller
            name="personal.city"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Toshkent" />}
          />
        </div>
        <div>
          <Label>Viloyat (Region) *</Label>
          <Controller
            name="personal.region"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Toshkent vil." />}
          />
        </div>
      </div>

      <div>
        <Label>Telefon (Mobil) *</Label>
        <Controller
          name="personal.phone"
          control={control}
          render={({ field }) => <Input {...field} placeholder="+998 90 123 45 67" type="tel" />}
        />
      </div>

      <div>
        <Label>Telegram nomi (Telegram Name)</Label>
        <Controller
          name="personal.telegramOrPhone"
          control={control}
          render={({ field }) => <Input {...field} placeholder="@username" />}
        />
      </div>

      <div>
        <Label>Email</Label>
        <Controller
          name="personal.email"
          control={control}
          render={({ field }) => <Input {...field} type="email" placeholder="email@example.com" />}
        />
      </div>
    </div>
  );
}

// Step 2: Interest & Availability
function Step2Interest({ control, watch }: { control: any; watch: any }) {
  const availabilityType = watch("interest.availabilityType");
  
  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-2">
        <Controller
          name="interest.interestedInGermany"
          control={control}
          render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label className="text-sm leading-tight">
          Men Germaniyada uzoq muddatli ishlash va doimiy yashashga qiziqaman.
          <br />
          <span className="text-muted-foreground">(Ich interessiere mich für langfristige Arbeit und dauerhaften Aufenthalt in Deutschland.)</span>
        </Label>
      </div>

      <div>
        <Label>Istalgan kasb (Gewünschter Beruf) *</Label>
        <Controller
          name="interest.desiredJob"
          control={control}
          render={({ field }) => <Input {...field} placeholder="Masalan: IT-mutaxassis" />}
        />
      </div>

      <div>
        <Label>Mavjudlik (Verfügbarkeit) *</Label>
        <Controller
          name="interest.availabilityType"
          control={control}
          render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now" className="text-sm">Hoziroq (Ab sofort)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="date" />
                <Label htmlFor="date" className="text-sm">Eng erta (Frühestens ab Datum)</Label>
              </div>
            </RadioGroup>
          )}
        />
      </div>

      {availabilityType === "date" && (
        <div>
          <Label>Sana (Datum)</Label>
          <Controller
            name="interest.earliestDate"
            control={control}
            render={({ field }) => <Input type="date" {...field} />}
          />
        </div>
      )}
    </div>
  );
}

// Step 3: Education
function Step3Education({ control, fields }: { control: any; fields: any }) {
  return (
    <div className="space-y-4">
      {fields.fields.map((field: any, index: number) => (
        <div key={field.id} className="p-3 border rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">{index + 1}. Ta'lim</span>
            {fields.fields.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => fields.remove(index)}>
                ✕
              </Button>
            )}
          </div>

          <div>
            <Label>Daraja (Abschluss) *</Label>
            <Controller
              name={`education.entries.${index}.degree`}
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {degreeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Boshlanish (Von) *</Label>
              <Controller
                name={`education.entries.${index}.periodFrom`}
                control={control}
                render={({ field }) => <Input type="month" {...field} />}
              />
            </div>
            <div>
              <Label>Tugash (Bis) *</Label>
              <Controller
                name={`education.entries.${index}.periodTo`}
                control={control}
                render={({ field }) => <Input type="month" {...field} />}
              />
            </div>
          </div>

          <div>
            <Label>Muassasa (Institution) *</Label>
            <Controller
              name={`education.entries.${index}.institution`}
              control={control}
              render={({ field }) => <Input {...field} placeholder="Universitet nomi" />}
            />
          </div>

          <div>
            <Label>Yo'nalish (Fachrichtung) *</Label>
            <Controller
              name={`education.entries.${index}.fieldOfStudy`}
              control={control}
              render={({ field }) => <Input {...field} placeholder="Masalan: Informatika" />}
            />
          </div>
        </div>
      ))}

      {fields.fields.length < 5 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fields.append({ degree: "bakalavr", periodFrom: "", periodTo: "", institution: "", fieldOfStudy: "" })}
          className="w-full"
        >
          + Ta'lim qo'shish
        </Button>
      )}
    </div>
  );
}

// Step 4: Work Experience
function Step4WorkExperience({ control, fields }: { control: any; fields: any }) {
  return (
    <div className="space-y-4">
      {fields.fields.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-4">
          Ish tajribasi yo'q (Keine Berufserfahrung)
        </p>
      )}

      {fields.fields.map((field: any, index: number) => (
        <div key={field.id} className="p-3 border rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">{index + 1}. Ish tajribasi</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => fields.remove(index)}>
              ✕
            </Button>
          </div>

          <div>
            <Label>Korxona / Firma *</Label>
            <Controller
              name={`workExperience.entries.${index}.company`}
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Boshlanish (Von) *</Label>
              <Controller
                name={`workExperience.entries.${index}.periodFrom`}
                control={control}
                render={({ field }) => <Input type="month" {...field} />}
              />
            </div>
            <div>
              <Label>Tugash (Bis) *</Label>
              <Controller
                name={`workExperience.entries.${index}.periodTo`}
                control={control}
                render={({ field }) => <Input type="month" {...field} />}
              />
            </div>
          </div>

          <div>
            <Label>Lavozim (Berufsbezeichnung) *</Label>
            <Controller
              name={`workExperience.entries.${index}.position`}
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </div>

          <div>
            <Label>Vazifalar (Tätigkeiten) *</Label>
            <Controller
              name={`workExperience.entries.${index}.tasks`}
              control={control}
              render={({ field }) => <Textarea {...field} rows={3} />}
            />
          </div>
        </div>
      ))}

      {fields.fields.length < 3 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fields.append({ company: "", periodFrom: "", periodTo: "", position: "", tasks: "" })}
          className="w-full"
        >
          + Ish tajribasi qo'shish
        </Button>
      )}
    </div>
  );
}

// Step 5: Language Skills
function Step5Languages({ control, watch }: { control: any; watch: any }) {
  const hasGermanCertificate = watch("languages.hasGermanCertificate");
  
  const renderLanguageSelect = (name: string, label: string) => (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languageLevelOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {renderLanguageSelect("languages.uzbekLevel", "O'zbek")}
        {renderLanguageSelect("languages.russianLevel", "Rus")}
        {renderLanguageSelect("languages.germanLevel", "Nemis")}
        {renderLanguageSelect("languages.englishLevel", "Ingliz")}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-sm">Boshqa til</Label>
          <Controller
            name="languages.otherLanguageName"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Til nomi" />}
          />
        </div>
        <div>
          <Label className="text-sm">Daraja</Label>
          <Controller
            name="languages.otherLanguageLevel"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {languageLevelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2 border-t">
        <Controller
          name="languages.hasGermanCertificate"
          control={control}
          render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label className="text-sm">Nemis tili sertifikati bor (Deutschzertifikat)</Label>
      </div>

      {hasGermanCertificate && (
        <div>
          <Label className="text-sm">Sertifikat darajasi</Label>
          <Controller
            name="languages.germanCertificateLevel"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {languageLevelOptions.filter(o => o.value !== "native").map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}
    </div>
  );
}

// Step 6: Driver's License
function Step6DriversLicense({ control, watch }: { control: any; watch: any }) {
  const hasLicense = watch("driversLicense.hasLicense");
  const selectedClasses = watch("driversLicense.classes") || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Controller
          name="driversLicense.hasLicense"
          control={control}
          render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label className="text-sm">Haydovchilik guvohnomasi bor (Führerschein vorhanden)</Label>
      </div>

      {hasLicense && (
        <div className="pl-4 border-l-2 border-border">
          <Label className="text-sm mb-2 block">Klasslar:</Label>
          <div className="grid grid-cols-5 gap-2">
            {licenseClasses.map((cls) => (
              <Controller
                key={cls}
                name="driversLicense.classes"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <Checkbox
                      checked={field.value?.includes(cls)}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...(field.value || []), cls]
                          : field.value?.filter((c: string) => c !== cls) || [];
                        field.onChange(newValue);
                      }}
                    />
                    <span className="text-sm uppercase">{cls}</span>
                  </label>
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Step 7: Germany Experience
function Step7GermanyExperience({ control, watch }: { control: any; watch: any }) {
  const hasExperience = watch("germanyExperience.hasExperience");

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Controller
          name="germanyExperience.hasExperience"
          control={control}
          render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label className="text-sm">Germaniyada bo'lganman (War in Deutschland)</Label>
      </div>

      {hasExperience && (
        <div className="pl-4 border-l-2 border-border space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm">Boshlanish (Von)</Label>
              <Controller
                name="germanyExperience.periodFrom"
                control={control}
                render={({ field }) => <Input type="month" {...field} />}
              />
            </div>
            <div>
              <Label className="text-sm">Tugash (Bis)</Label>
              <Controller
                name="germanyExperience.periodTo"
                control={control}
                render={({ field }) => <Input type="month" {...field} />}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Faoliyat / Maqsad (Tätigkeit/Zweck)</Label>
            <Controller
              name="germanyExperience.activity"
              control={control}
              render={({ field }) => <Textarea {...field} rows={2} placeholder="Masalan: Sayohat, ishlash" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Step 8: Other Information
function Step8OtherInfo({ control }: { control: any }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Sertifikatlar / Qo'shimcha ta'lim</Label>
        <Controller
          name="otherInfo.certificates"
          control={control}
          render={({ field }) => (
            <Textarea {...field} rows={4} placeholder="Sertifikatlar, kurslar va boshqa malakalaringiz..." />
          )}
        />
      </div>

      <div>
        <Label>Motivatsiya</Label>
        <Controller
          name="otherInfo.motivation"
          control={control}
          render={({ field }) => (
            <Textarea {...field} rows={4} placeholder="Nima uchun Germaniyada ishlashni xohlaysiz?" />
          )}
        />
      </div>
    </div>
  );
}

// Step 9: Consent
function Step9Consent({ control, watch }: { control: any; watch: any }) {
  const { formState: { errors } } = useFormContext();
  const agreed = watch("consent.agreed");

  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
        <p className="mb-2">
          Ma'lumotlaringiz faqat Aatrium tomonidan ish bilan ta'minlash maqsadida qayta ishlanadi.
        </p>
        <p>
          Ihre Daten werden nur von Aatrium zum Zweck der Arbeitsvermittlung verarbeitet.
        </p>
      </div>

      <div className="flex items-start space-x-2">
        <Controller
          name="consent.agreed"
          control={control}
          render={({ field }) => (
            <Checkbox id="consent-agreed" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="consent-agreed" className="text-sm leading-tight cursor-pointer">
          Men roziman / Ich stimme zu *
        </Label>
      </div>

      <div>
        <Label>Sana (Datum)</Label>
        <Controller
          name="consent.date"
          control={control}
          render={({ field }) => <Input type="date" {...field} disabled />}
        />
      </div>

      {errors.consent?.agreed && (
        <p className="text-sm text-destructive">
          {errors.consent.agreed.message}
        </p>
      )}
    </div>
  );
}
