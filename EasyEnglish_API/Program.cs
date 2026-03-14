using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Authentication;
using EasyEnglish_API.Interfaces.Feedbacks;
using EasyEnglish_API.Interfaces.Membership;
using EasyEnglish_API.Interfaces.User;
using EasyEnglish_API.Middleware;
using EasyEnglish_API.Repositories.Authentication;
using EasyEnglish_API.Repositories.FeedbackRepo;
using EasyEnglish_API.Repositories.Membership;
using EasyEnglish_API.Repositories.User;
using EasyEnglish_API.Sercurity;
using EasyEnglish_API.Services.AuthService;
using EasyEnglish_API.Services.FeedbackService;
using EasyEnglish_API.Services.Membership;
using EasyEnglish_API.Utils;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using EasyEnglish_API.Services.UserService;
using EasyEnglish_API.Interfaces;
using EasyEnglish_API.Repositories.Courses;
using EasyEnglish_API.Services.Courses;
using EasyEnglish_API.Interfaces.Dashboard;
using EasyEnglish_API.Repositories.Dashboard;
using EasyEnglish_API.Services.Dashboard;

using EasyEnglish_API.Interfaces.Quizs;


using EasyEnglish_API.Repositories.Quizs;
using EasyEnglish_API.Services;
using EasyEnglish_API.ExternalService;
using EasyEnglish_API.Interfaces.Subscriptionplan;
using EasyEnglish_API.Repositories.Subscriptionplan;
using EasyEnglish_API.Services.Subscriptionplan;
using EasyEnglish_API.Interfaces.Flashcard;
using EasyEnglish_API.Repositories.Flashcard;
using EasyEnglish_API.Services.Flashcard;

using EasyEnglish_API.Services.AIExam;
using EasyEnglish_API.Interfaces.AIExam;
using EasyEnglish_API.Repositories.AIExam;
using EasyEnglish_API.Interfaces.Profile;
using EasyEnglish_API.Repositories.Profile;
using EasyEnglish_API.Services.Profile;
using EasyEnglish_API.Interfaces.Score;
using EasyEnglish_API.Services.Score;
using EasyEnglish_API.Repositories.Score;
using EasyEnglish_API.Interfaces.Transaction;
using EasyEnglish_API.Repositories.Transaction;
using EasyEnglish_API.Services.Transaction;



namespace EasyEnglish_API {
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ===== Core =====
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();

            // ===== Swagger =====
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "EasyEnglish API",
                    Version = "v1",
                    Description = "English Mastery Training API"
                });

                // JWT
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "Nhập: Bearer {token}",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

            // (tuỳ chọn) Nếu bạn muốn Swagger đọc XML comment từ code
            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                if (File.Exists(xmlPath))
                    c.IncludeXmlComments(xmlPath);
            });

            // ===== Database =====
            builder.Services.AddDbContext<EasyEnglishDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // ===== JWT Authentication =====
            var jwt = builder.Configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwt["Key"]!);

            builder.Services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwt["Issuer"],
                        ValidAudience = jwt["Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(key),
                        ClockSkew = TimeSpan.FromSeconds(30)
                    };
                });
            builder.Services.AddAuthorization(opt =>
            {
                opt.AddPolicy("AdminOnly", policy =>
                    policy.RequireAuthenticatedUser()
                          .RequireClaim(ClaimTypes.Role, "ADMIN"));
            });

            builder.Services.AddAuthorization(opt =>
            {
                opt.AddPolicy("TeacherOnly", policy =>
                    policy.RequireAuthenticatedUser()
                          .RequireClaim(ClaimTypes.Role, "TEACHER"));
            });

            builder.Services.AddAuthorization(opt =>
            {
                opt.AddPolicy("StudentOnly", policy =>
                    policy.RequireAuthenticatedUser()
                          .RequireClaim(ClaimTypes.Role, "STUDENT"));
            });

            builder.Services.AddAuthorization();

            // CORS
            const string MyCors = "_myCors";

            builder.Services.AddCors(options =>
            {
                options.AddPolicy(MyCors, policy => policy
                    .WithOrigins(
                        "http://localhost:3000",
                        "https://localhost:3000",
                        "https://beerier-superlogically-maxwell.ngrok-free.dev" // 👈 và cả domain ngrok
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials());
            });

            builder.Services.AddScoped<CloudflareExternal>();
            builder.Services.AddScoped<AISpeakingExternal>();
            builder.Services.AddScoped<AIWritingExternal>();
            builder.Services.AddScoped<AIQuizExternal>();
            // == Repositories ==
            builder.Services.AddScoped<IAuthRepository, AuthRepository>();
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<ICourseRepository, CourseRepository>();
            builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
            builder.Services.AddScoped<IFlashcardRepository, FlashcardRepository>();
            builder.Services.AddScoped<IScoreRepository, ScoreRepository>();
            builder.Services.AddScoped<ISubscriptionPlanRepository, SubscriptionPlanRepository>();
            builder.Services.AddScoped<IFeedbackRepository, FeedBackRepository>();
            builder.Services.AddScoped<IMembershipRepository, MembershipRepository>();
            builder.Services.AddScoped<IQuizRepository, QuizRepository>();
            builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
            builder.Services.AddScoped<IAIPromptRepository, AIPromptReposity>();
            builder.Services.AddScoped<IAIReviewRepository, AIReviewRepository>();
            builder.Services.AddScoped<IAISubmissionRepository, AISubmissionRepository>();
            builder.Services.AddScoped<IProfileRepository, ProfileRepository>();
            builder.Services.AddScoped<ITeacherInForRepository, TeacherInforRepository>();

            // == Serviecs ==
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<ICourseService, CourseService>();
            builder.Services.AddScoped<IDashboardService, DashboardService>();
            builder.Services.AddScoped<IFlashcardService, FlashcardService>();
            builder.Services.AddScoped<IScoreService, ScoreService>();
            builder.Services.AddScoped<ISubscriptionPlanService, SubscriptionPlanService>();
            builder.Services.AddScoped<IFeedbackService, FeedbackService>();
            builder.Services.AddScoped<IMembershipService, MembershipService>();
            builder.Services.AddScoped<IQuizService, QuizService>();
            builder.Services.AddScoped<ITransactionService, TransactionService>();
            builder.Services.AddScoped<IAISpeakingService, AISpeakingService>();
            builder.Services.AddScoped<IAIWritingService,  AIWritingService>();
            builder.Services.AddScoped<IAIQuizService, AIQuizService>();
            builder.Services.AddScoped<IProfileService, ProfileService>();
            builder.Services.AddScoped<ITeacherInforService, TeacherInforService>();


            // Email Sender
            builder.Services.Configure<EmailSetting>(builder.Configuration.GetSection("EmailSettings"));
            builder.Services.AddSingleton<EmailSender>();

            // ===== OTP Service =====
            builder.Services.AddMemoryCache();
            builder.Services.AddSingleton<IOtpService, OtpService>();

            // ===== Token Service (tạo access/refresh token) =====
            builder.Services.AddSingleton<ITokenService, TokenService>();
            builder.Services.AddHttpContextAccessor();

            //Json accept /n
            builder.Services.AddControllers().AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Encoder =
                    System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
            });
            var app = builder.Build();

            
            // ===== Swagger =====
            if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // ===== Middlewares =====
            app.UseHttpsRedirection();


            app.UseRouting();
            app.UseCors(MyCors);

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseMiddleware<RequestLoggingMiddleware>();
            app.MapControllers();

            app.Run();
        }
    }
}