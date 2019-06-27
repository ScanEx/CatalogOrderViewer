using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpsPolicy;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Swagger;
using Server.OAuth;

namespace Server
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // // Setup options service
            // services.AddOptions();

            // // Load options from section "MyMiddlewareOptionsSection"
            // services.Configure<GmxOAuthOptions>(Configuration.GetSection("GmxOAuthOptionsSection"));

            services                    
                .AddMvc()                
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_2)
                .AddJsonOptions(options => options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore);

            services.AddMemoryCache();

            services.AddDbContext<CatalogContext>(options => {
                options
                    .UseLazyLoadingProxies()
                    .UseNpgsql(Configuration.GetConnectionString("DefaultConnection"));
            });
            // services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            //     .AddCookie()
            //     .AddOAuth("oauth", options => {
            //         options.ClientId = "1";
            //         options.ClientSecret = "DE0EA580-7F39-4880-8C1E-55652F4A20D0";
            //         options.CallbackPath = new PathString("/oAuth2/oAuthCallback.htm");
            //         options.AuthorizationEndpoint = "http://my.kosmosnimki.ru/Account/Login";
            //         options.TokenEndpoint = "http://my.kosmosnimki.ru/oAuth/AccessToken";
            //         options.Scope.Add("http://maps.kosmosnimki.ru");
            //         options.Scope.Add("http://localhost:5001");
            //         options.SaveTokens = true;
            //         options.Events = new OAuthEvents()
            //         {
            //             OnRemoteFailure = HandleOnRemoteFailure
            //         };
            //     });
            services.AddSwaggerGen(c => c.SwaggerDoc ("v1", new Info { Title = "Catalog Order Information Service API", Version = "v1" }));
        }

        private async Task HandleOnRemoteFailure(RemoteFailureContext context)
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "text/html";
            await context.Response.WriteAsync("<html><body>");
            await context.Response.WriteAsync("A remote failure has occurred: " + UrlEncoder.Default.Encode(context.Failure.Message) + "<br>");

            if (context.Properties != null)
            {
                await context.Response.WriteAsync("Properties:<br>");
                foreach (var pair in context.Properties.Items)
                {
                    await context.Response.WriteAsync($"-{ UrlEncoder.Default.Encode(pair.Key)}={ UrlEncoder.Default.Encode(pair.Value)}<br>");
                }
            }

            await context.Response.WriteAsync("<a href=\"/\">Home</a>");
            await context.Response.WriteAsync("</body></html>");

            // context.Response.Redirect("/error?FailureMessage=" + UrlEncoder.Default.Encode(context.Failure.Message));

            context.HandleResponse();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseDefaultFiles();
            app.UseStaticFiles();            
            // app.UseHttpsRedirection();
            // app.UseAuthentication();

            // app.Use(async (HttpContext context, Func<Task> next) =>
            // {
            //     //do work before the invoking the rest of the pipeline       

            //     await next.Invoke(); //let the rest of the pipeline run

            //     //do work after the rest of the pipeline has run     
            // });      

            var gmxOAuthOptions = Configuration.GetSection("GmxOAuthOptionsSection").Get<GmxOAuthOptions>();
            app.UseGmxOAuthServer(gmxOAuthOptions);
            app.UseMvc();
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Catalog Order Information Service API");
            });            
        }
    }
}
