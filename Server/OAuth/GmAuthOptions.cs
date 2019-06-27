using System.Collections.Generic;

namespace Server.OAuth {
    public class GmxOAuthOptions
    {
        public string AuthenticationEndpoint { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public Dictionary<string,string> Scopes { get; set; }
    }
}