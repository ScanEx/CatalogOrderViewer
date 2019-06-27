using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Text;
using System.IO;
using System.Net.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Caching.Memory;
using System.Net;

namespace Server.OAuth {
    public class GmxOAuthServer
    {
        private readonly RequestDelegate _next;
        private readonly GmxOAuthOptions _options;        
        private readonly IMemoryCache _cache;
        public GmxOAuthServer(RequestDelegate next, IMemoryCache cache, IOptions<GmxOAuthOptions> options)
        {
            this._next = next;            
            this._cache = cache;
            this._options = options.Value;
        }
        async void Login (HttpContext context) {
            var antiscrf = context.Request.Query["sync"].ToString();
            if(context.Request.Cookies.ContainsKey (antiscrf)) {                        
                var v = context.Request.Cookies[antiscrf];
                context.Response.Cookies.Append(antiscrf, v, new CookieOptions { Expires = DateTime.Now.AddDays(-1) });  // prev auth cookie
            }
                
            string state = Guid.NewGuid().ToString("N");
            string sid;
            if (context.Request.Cookies["sid"] == null)
            {
                sid =  Guid.NewGuid().ToString("N");
                context.Response.Cookies.Append("sid", sid, new CookieOptions { HttpOnly = true, Expires = DateTime.Now.AddDays(1) });
            }
            else
            {
                sid = context.Request.Cookies["sid"];
            }               

            context.Response.Headers["Cache-Control"] = "public";
            context.Response.Headers["Expires"] = DateTime.Now.AddMinutes(15).ToString("r", System.Globalization.CultureInfo.InvariantCulture);
            
            var result = JObject.FromObject (
                new {
                    Status = "ok",
                    Service = new { ServerId = "Catalog" },
                    Result = new { State = state }
                }
            );           
            var cb = context.Request.Query["CallbackName"].ToString();
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsync (string.Format("{0}({1})", cb, result.ToString()));            
        }
        async void HandleCallback (HttpContext context) {
            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.WriteAsync(@"<html>
                <head>
                    <script>
                        var target = opener || parent;
                        try {
                            target.authorizationGrant(window.location.search);
                        }
                        catch(e) {
                            console.log(e);
                        }
                        if (opener) {
                            window.close();
                        }                            
                    </script>
                </head>
                <body>
                </body>
                </html>");            
        }

        // static byte[] GetBytesFromUrl (string url) {
        //     var buff = new byte[4096];
        //     var rq = (HttpWebRequest)HttpWebRequest.Create(url);
        //     rq.Method = "GET";
        //     using (var rs = rq.GetResponse())
        //     using (var str = rs.GetResponseStream())
        //     using (var ms = new MemoryStream()){
        //         int count = 0;
        //         do {
        //             count = str.Read(buff, 0, buff.Length);
        //             ms.Write(buff, 0, count);
        //         } while (count != 0);
        //         return ms.ToArray();
        //     }
        // }

        static Token GetToken(GmxOAuthOptions options, string code)
        {
            var url = string.Format ("{0}/oAuth/AccessToken?client_id={1}&client_secret={2}&code={3}", options.AuthenticationEndpoint, options.ClientId, options.ClientSecret, code);
            var tokenStream = ReadContent (url);
            var oResult = ParseResponse(tokenStream);
            var dtExpires = oResult["expires"].Value<DateTime>();
            return new Token(oResult["access_token"].Value<string>(), dtExpires) { ClientData = oResult["scope"].Value<string>() };
        }

        static JToken ParseResponse(byte[] responseStream)
        {
            string json = Encoding.UTF8.GetString(responseStream);
            var response = JObject.Parse(json);
            if (response["Status"].Value<string>() == "Error") {
                throw new Exception(response["Result"]["Message"].Value<string>());
            }
            return response["Result"];
        }
        public bool AcceptToken(HttpContext context, string token, string states, string anticsrf, string old)
        {            
            string[] a = states.Split(',');
            foreach (string s in a)
            {
                string state = s.Trim();
                
                string sid = this._cache.Get(state) as string;
                if (!String.IsNullOrEmpty(sid) && this._cache.Get(sid) is ConcurrentDictionary<string, string>)
                {
                    var d = this._cache.Get(sid) as ConcurrentDictionary<string, string>;                                        
                    d[anticsrf] = token;
                    if (!String.IsNullOrEmpty(old)) {
                        d[old] = "old";
                    }                    
                    this._cache.Remove(state);
                }
            }
            return false;
        }       
        static oAuthUserInfo ParseUserInfo(byte[] userInfoStream)
        {
            var oResult = ParseResponse(userInfoStream);

            string sID = oResult["ID"].Value<string>();
            string EMail = oResult["Email"].Value<string>();
            string Login = oResult["Login"].Value<string>();
            string FullName = oResult["FullName"].Value<string>();
            string Phone = oResult["Phone"].Value<string>();
            string Organization = oResult["Organization"].Value<string>();
            string Position = oResult["Position"].Value<string>();
            string Role = oResult["Role"].Value<string>();
            string clientId = oResult["ClientId"].Value<string>();
            DateTime? tokenExpires = oResult["TokenExpires"].Value<DateTime>();
            string scope = oResult["Scope"].Value<string>();
            StringBuilder authServer = new StringBuilder(string.IsNullOrEmpty (oResult["Server"].Value<string>()) ? "MyKosmosnimki" : oResult["Server"].Value<string>());
            authServer[0] = char.ToUpper(authServer[0]);
            return new oAuthUserInfo 
            {
                ID = sID,
                Email = EMail,
                Login = Login,
                Server = (oAuthServers)Enum.Parse(typeof(oAuthServers), authServer.ToString()),
                FullName = FullName,
                Phone = Phone,
                Organization = Organization,
                Position = Position,
                Role = Role,
                ClientId = clientId,
                TokenExpires = tokenExpires,
                Scope = scope
            };
        }
        static oAuthUserInfo GetUserInfo(string authenticationEndpoint, string access_token)
        {            
            string url = string.Format("{0}/Handler/Me?token={1}", authenticationEndpoint, access_token);
            byte[] tokenStream = ReadContent (url);
            return ParseUserInfo(tokenStream);
        }
        static byte[] ReadFromRemoteStream(Stream remoteStream)
        {
            byte[] tempBuf = new byte[10 * 1024 * 1024];
            int byteRead = 0;
            const int packetSize = 1024 * 1024;
            int currRead = -1;
            do
            {
                byteRead += (currRead = remoteStream.Read(tempBuf, byteRead, packetSize));
            } while (currRead != 0);

            byte[] buf = new byte[byteRead];
            for (int i = 0; i < byteRead; ++i) {
                buf[i] = tempBuf[i];
            }
            return buf;
        }
        private delegate byte[] GetContentDelegate(string url);
        private const int RemoteReadTimeoutInSeconds = 30;
        static byte[] ReadContent(string url)
        {
            byte[] bytes;
            var rq = HttpWebRequest.Create(url);
            using (var rs = rq.GetResponse()) {
                using (var st = rs.GetResponseStream()) {
                    bytes = ReadFromRemoteStream(st);
                    st.Close();
                }
                rs.Close();
            }
            return bytes;            
        }     
        async void Authenticate (HttpContext context) {
            string returnUrl = context.Request.Query["return_url"];
            string code = context.Request.Query["code"];
            string old = context.Request.Cookies["sync"];
            string state = context.Request.Query["state"];
            string host = context.Request.Host.ToString();
            string path = context.Request.Path.ToString();
            string cb = context.Request.Query["CallbackName"].ToString();
            if (!String.IsNullOrEmpty(returnUrl))
            {
                context.Response.ContentType = "text/html";
                await context.Response.WriteAsync(string.Format ("<script>location.href='{0}'</script>", returnUrl));                
            }
            else {                
                string anticsrf = Guid.NewGuid().ToString("N");
                
                if (old == null) {
                    old = "";
                }            
                
                try
                {
                    var tempToken = GetToken(this._options, code);
                    string[] scopes = tempToken.ClientData.Split(',');
                    for (int i = 0; i < scopes.Length; ++i)
                    {
                        string resourceServer = this._options.Scopes[scopes[i].ToLower()];
                        if (!resourceServer.StartsWith("http://localhost") && !path.StartsWith(resourceServer))
                        {
                            // Кросcдоменное обращение
                            Uri tokenEndpoint = new Uri(string.Format("{0}/oAuth2/Login.ashx", resourceServer));
                            HttpWebRequest request = (HttpWebRequest)HttpWebRequest.Create(string.Format("{0}?wrapstyle=none&sync={1}&state={2}&old={3}", tokenEndpoint.OriginalString, anticsrf, state, old));
                            request.Headers.Add("Authorization", string.Format("Bearer {0}", tempToken.TokenString));
                            using (var resp = request.GetResponse())
                            using (var sr = new StreamReader(resp.GetResponseStream(), Encoding.UTF8))
                            {
                                sr.ReadToEnd();
                            }
                        }
                        else
                        {
                            // Один домен - переход на 1-й этап авторизации                         
                            AcceptToken(context, tempToken.TokenString, state, anticsrf, old);
                        }
                    }
                    if (tempToken != null) {                
                        context.Response.Cookies.Append("sync", anticsrf, new CookieOptions { Expires = tempToken.Expires, Path = host });
                    }

                    var ui = GetUserInfo(this._options.AuthenticationEndpoint, tempToken.TokenString);
                    var result = JObject.FromObject (new {
                        Status = "ok",
                        Result = new {
                            Login = ui.Email,
                            FullName = ui.FullName,
                            Email = ui.Email,
                            Organization = ui.Organization,
                            Position = ui.Position,
                            Nickname = ui.Login,
                            Phone = ui.Phone,
                            Server = ui.Server
                        }
                    });                    
                    
                    context.Response.ContentType = "application/json; charset=utf-8";
                    await context.Response.WriteAsync (string.Format("{0}({1})", cb, result.ToString()));                       
                }
                catch (Exception e)
                {
                    if (!String.IsNullOrEmpty(returnUrl))
                    {
                        context.Response.ContentType = "text/html; charset=utf-8";
                        await context.Response.WriteAsync(string.Format("<script>location.href='{0}'</script>", returnUrl));
                    }
                    else {
                        var error = new {
                            Status = "error",
                            ErrorInfo = new {
                                ErrorMessage = e.Message,
                                ExceptionType = e.GetType().ToString(), 
                                StackTrace = e.StackTrace
                            }
                        };
                        await context.Response.WriteAsync (JObject.FromObject(error).ToString());
                    }
                }
            }            
        }
        public async Task InvokeAsync(HttpContext context)
        {            
            switch (context.Request.Path) {
                case "/oAuth2/LoginDialog.ashx":
                    Login (context);                     
                    break;
                case "/oAuth2/oAuthCallback.htm":
                    HandleCallback (context);                    
                    break;
                case "/oAuth2/oAuthCallback.ashx":                    
                    Authenticate(context);                    
                    break;
                default:
                    await _next(context);
                    break;
            }
        }
    }
    public static class GmxOAuthServerExtensions
    {
        public static IApplicationBuilder UseGmxOAuthServer(this IApplicationBuilder builder, GmxOAuthOptions options)
        {            
            return builder.UseMiddleware<GmxOAuthServer>(new OptionsWrapper<GmxOAuthOptions>(options));
        }
    }
}