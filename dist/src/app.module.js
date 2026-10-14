"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const attendance_module_1 = require("./attendance/attendance.module");
const auth_module_1 = require("./auth/auth.module");
const batches_module_1 = require("./batches/batches.module");
const catalog_module_1 = require("./catalog/catalog.module");
const email_module_1 = require("./email/email.module");
const journey_module_1 = require("./journey/journey.module");
const parent_module_1 = require("./parent/parent.module");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const reports_module_1 = require("./reports/reports.module");
const storage_module_1 = require("./storage/storage.module");
const sessions_module_1 = require("./sessions/sessions.module");
const students_module_1 = require("./students/students.module");
const tutors_module_1 = require("./tutors/tutors.module");
const exams_module_1 = require("./exams/exams.module");
const finance_module_1 = require("./finance/finance.module");
const quizzes_module_1 = require("./quizzes/quizzes.module");
const resources_module_1 = require("./resources/resources.module");
const password_reset_module_1 = require("./auth/password-reset.module");
const activity_module_1 = require("./activity/activity.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            storage_module_1.StorageModule,
            email_module_1.EmailModule,
            auth_module_1.AuthModule,
            catalog_module_1.CatalogModule,
            tutors_module_1.TutorsModule,
            students_module_1.StudentsModule,
            batches_module_1.BatchesModule,
            sessions_module_1.SessionsModule,
            attendance_module_1.AttendanceModule,
            journey_module_1.JourneyModule,
            reports_module_1.ReportsModule,
            parent_module_1.ParentModule,
            exams_module_1.ExamsModule,
            finance_module_1.FinanceModule,
            quizzes_module_1.QuizzesModule,
            resources_module_1.ResourcesModule,
            password_reset_module_1.PasswordResetModule,
            activity_module_1.ActivityModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map