import { z } from 'zod';

// Step 1: Personal Data
export const personalDataSchema = z.object({
  firstName: z.string().min(1, 'Ism kiritilishi shart / Vorname erforderlich'),
  lastName: z.string().min(1, 'Familiya kiritilishi shart / Nachname erforderlich'),
  birthDate: z.string().min(1, 'Tug\'ilgan sana kiritilishi shart / Geburtsdatum erforderlich'),
  gender: z.enum(['erkak', 'ayol', 'boshqa'], {
    required_error: 'Jinsi tanlanishi shart / Geschlecht erforderlich',
  }),
  maritalStatus: z.enum(['boydoq', 'turmush', 'ajrashgan', 'beva'], {
    required_error: 'Oilaviy holat tanlanishi shart / Familienstand erforderlich',
  }),
  hasChildren: z.boolean(),
  childrenCount: z.string().optional(),
  childrenAges: z.string().optional(),
  citizenship: z.string().min(1, 'Fuqarolik kiritilishi shart / Staatsangehörigkeit erforderlich'),
  city: z.string().min(1, 'Shahar kiritilishi shart / Stadt erforderlich'),
  region: z.string().min(1, 'Viloyat kiritilishi shart / Region erforderlich'),
  phone: z.string().min(1, 'Telefon kiritilishi shart / Telefon erforderlich'),
  telegramOrPhone: z.string().optional(),
  email: z.string().email('Email formati noto\'g\'ri / Ungültige Email').optional().or(z.literal('')),
});

// Step 2: Interest & Availability
export const interestAvailabilitySchema = z.object({
  interestedInGermany: z.boolean(),
  desiredJob: z.string().min(1, 'Istalgan kasb kiritilishi shart / Gewünschter Beruf erforderlich'),
  availabilityType: z.enum(['now', 'date'], {
    required_error: 'Mavjudlik tanlanishi shart / Verfügbarkeit erforderlich',
  }),
  earliestDate: z.string().optional(),
});

// Education Entry
export const educationEntrySchema = z.object({
  degree: z.enum(['diplom_kollej', 'diplom_texnikum', 'bakalavr', 'magistr', 'doktorantura'], {
    required_error: 'Daraja tanlanishi shart / Abschluss erforderlich',
  }),
  periodFrom: z.string().min(1, 'Boshlanish sanasi kiritilishi shart / Von erforderlich'),
  periodTo: z.string().min(1, 'Tugash sanasi kiritilishi shart / Bis erforderlich'),
  institution: z.string().min(1, 'Muassasa kiritilishi shart / Institution erforderlich'),
  fieldOfStudy: z.string().min(1, 'Yo\'nalish kiritilishi shart / Fachrichtung erforderlich'),
});

// Step 3: Education
export const educationSchema = z.object({
  entries: z.array(educationEntrySchema).min(1, 'Kamida bitta ta\'lim kiritilishi shart / Mindestens eine Ausbildung erforderlich'),
});

// Work Experience Entry
export const workExperienceEntrySchema = z.object({
  company: z.string().min(1, 'Korxona kiritilishi shart / Firma erforderlich'),
  periodFrom: z.string().min(1, 'Boshlanish sanasi kiritilishi shart / Von erforderlich'),
  periodTo: z.string().min(1, 'Tugash sanasi kiritilishi shart / Bis erforderlich'),
  position: z.string().min(1, 'Lavozim kiritilishi shart / Berufsbezeichnung erforderlich'),
  tasks: z.string().min(1, 'Vazifalar kiritilishi shart / Tätigkeiten erforderlich'),
});

// Step 4: Work Experience
export const workExperienceSchema = z.object({
  entries: z.array(workExperienceEntrySchema),
});

// Language Level
export const languageLevelSchema = z.enum(['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'native']);

// Step 5: Language Skills
export const languageSkillsSchema = z.object({
  uzbekLevel: languageLevelSchema,
  russianLevel: languageLevelSchema,
  germanLevel: languageLevelSchema,
  englishLevel: languageLevelSchema,
  otherLanguageName: z.string().optional(),
  otherLanguageLevel: languageLevelSchema.optional(),
  hasGermanCertificate: z.boolean(),
  germanCertificateLevel: z.enum(['a1', 'a2', 'b1', 'b2', 'c1', 'c2']).optional(),
});

// Step 6: Driver's License
export const driversLicenseSchema = z.object({
  hasLicense: z.boolean(),
  classes: z.array(z.enum(['a1', 'a', 'b', 'be', 'c', 'ce', 'd', 'de', 'tm', 'tb'])),
});

// Step 7: Germany Experience
export const germanyExperienceSchema = z.object({
  hasExperience: z.boolean(),
  periodFrom: z.string().optional(),
  periodTo: z.string().optional(),
  activity: z.string().optional(),
});

// Step 8: Other Information
export const otherInfoSchema = z.object({
  certificates: z.string().optional(),
  motivation: z.string().optional(),
});

// Step 9: Consent
export const consentSchema = z.object({
  agreed: z.boolean().refine((val) => val === true, {
    message: 'Rozilik bildirilishi shart / Einwilligung erforderlich',
  }),
  date: z.string(),
});

// Complete Registration Schema
export const registrationSchema = z.object({
  personal: personalDataSchema,
  interest: interestAvailabilitySchema,
  education: educationSchema,
  workExperience: workExperienceSchema,
  languages: languageSkillsSchema,
  driversLicense: driversLicenseSchema,
  germanyExperience: germanyExperienceSchema,
  otherInfo: otherInfoSchema,
  consent: consentSchema,
});

export type RegistrationData = z.infer<typeof registrationSchema>;
export type PersonalData = z.infer<typeof personalDataSchema>;
export type InterestAvailability = z.infer<typeof interestAvailabilitySchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type WorkExperienceEntry = z.infer<typeof workExperienceEntrySchema>;
export type LanguageSkills = z.infer<typeof languageSkillsSchema>;
export type DriversLicense = z.infer<typeof driversLicenseSchema>;
export type GermanyExperience = z.infer<typeof germanyExperienceSchema>;
export type OtherInfo = z.infer<typeof otherInfoSchema>;
export type Consent = z.infer<typeof consentSchema>;
