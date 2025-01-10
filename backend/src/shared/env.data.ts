
interface CharLimits {
    min: number;
    max: number;
  }
  
  interface IPostEnvData {
    ALPHA_NUM_UNDERSCORE: RegExp;
    MIN_POST_NAME_PUBLISHER: number;
    MIN_POST_NAME: number;
    MAX_POST_NAME: number;
    MIN_POST_CODE: number;
    MAX_POST_CODE: number;
    SECTIONS: string[];
    COMPONENTS: string[];
    OVERALL: string[];
  }
  
  interface ContactUsEnvData {
    MIN_NAME_LENGTH: number;
    MAX_NAME_LENGTH: number;
    MIN_REASON_LENGTH: number;
    MAX_REASON_LENGTH: number;
  }
  
  interface UserEnvData {
    ALPHA_NUM_SPECIAL_CHAR: RegExp;
    MIN_PWD_LENGTH: number;
    MAX_PWD_LENGTH: number;
    MIN_EMAIL_OTP: number;
    MAX_EMAIL_OTP: number;
    EMAIL_VERIFICATION_OTP_EXPIRY: number;
    PASSWORD_RESET_TOKEN_EXPIRY: number;
    PWD_RESET_ERROR_MSG: string;
    OTP_ERROR_MSG: string;
  }
  
  interface AdminData {
    STATUS: string[];
    STATUS_DEFAULT: string;
    ROLE_APPLIED: string[];
    REQUEST_DOC_EXPIRY: number;
  }
  
  export const COMMON_COMPONENT_POST_CHAR_LIMITS: Record<string, CharLimits> = {
    short_information: { min: 100, max: 2500 },
    highlighted_information: { min: 50, max: 500 },
    department: { min: 5, max: 100 },
    stage_level: { min: 5, max: 50 },
  };
  
  // ------------------------------
  
  const POST_ENV_DATA: IPostEnvData = {
    ALPHA_NUM_UNDERSCORE: /^[A-Za-z0-9_]+$/,
    MIN_POST_NAME_PUBLISHER: Number(process.env.MIN_POST_NAME_PUBLISHER) || 6,
    MIN_POST_NAME: Number(process.env.MIN_POST_NAME) || 20,
    MAX_POST_NAME: Number(process.env.MAX_POST_NAME) || 1000,
    MIN_POST_CODE: Number(process.env.MIN_POST_CODE) || 6,
    MAX_POST_CODE: Number(process.env.MAX_POST_CODE) || 100,
    SECTIONS: [
      "result",
      "admit_card",
      "latest_job",
      "answer_key",
      "syllabus",
      "certificate_verification",
      "admission",
      "important",
    ],
    COMPONENTS: ["date", "common", "link", "fee"],
    OVERALL: [],
  };
  
  // Populate OVERALL dynamically
  POST_ENV_DATA.OVERALL = [
    ...POST_ENV_DATA.SECTIONS,
    ...POST_ENV_DATA.COMPONENTS,
  ];
  export { POST_ENV_DATA };
  
  // -------------------------------------------
  
  export const CONTACT_US_ENV_DATA: ContactUsEnvData = {
    MIN_NAME_LENGTH: Number(process.env.MIN_NAME_LENGTH) || 3,
    MAX_NAME_LENGTH: Number(process.env.MAX_NAME_LENGTH) || 100,
    MIN_REASON_LENGTH: Number(process.env.MIN_REASON_LENGTH) || 100,
    MAX_REASON_LENGTH: Number(process.env.MAX_REASON_LENGTH) || 500,
  };
  
  export const USER_ENV_DATA: UserEnvData = {
    ALPHA_NUM_SPECIAL_CHAR: /^[A-Za-z0-9!@#$%^&*(),.?":{}|<>_+\\-]*$/,
    MIN_PWD_LENGTH: Number(process.env.MIN_PWD_LENGTH) || 6,
    MAX_PWD_LENGTH: Number(process.env.MAX_PWD_LENGTH) || 50,
    MIN_EMAIL_OTP: Number(process.env.MIN_EMAIL_OTP) || 100000,
    MAX_EMAIL_OTP: Number(process.env.MAX_EMAIL_OTP) || 999999,
    EMAIL_VERIFICATION_OTP_EXPIRY:
      Number(process.env.EMAIL_VERIFICATION_OTP_EXPIRY) || 3,
    PASSWORD_RESET_TOKEN_EXPIRY:
      Number(process.env.PASSWORD_RESET_TOKEN_EXPIRY) || 3,
    PWD_RESET_ERROR_MSG: "Invalid password reset token!",
    OTP_ERROR_MSG: "Invalid OTP!",
  };
  
  export const ADMIN_DATA: AdminData = {
    STATUS: ["pending", "approved", "rejected"],
    STATUS_DEFAULT: "pending",
    ROLE_APPLIED: ["publisher", "admin", "approver", "none"],
    REQUEST_DOC_EXPIRY: 43200, // in min (everything is in minute)
  };
  