using System;

namespace Server.OAuth {
    public enum oAuthServers
    {
        MyKosmosnimki = 1,
        Google,
        Facebook 
    }    
    /// <summary>
    /// Интерфейс данных о пользователе
    /// </summary>
    public class oAuthUserInfo
    {
        public string ID {get; set; }
        public string Email { get; set; }
        public string Login { get; set; }
        public string FullName { get; set; }
        public string Phone { get; set; }
        public string Organization { get; set; }
        public string Position { get; set; }
        public string Role { get; set; }
        public oAuthServers Server { get; set; }
        public string ClientId { get; set; }
        public DateTime? TokenExpires { get; set; }
        public string Scope { get; set; }

        public oAuthUserInfo()
        {
        }

        public oAuthUserInfo(string id, string email, string login, oAuthServers server, string fullname, string phone, string organization)
        {
            ID = id;
            Email = email;
            Login = login;
            Server = server;
            FullName = fullname;
            Phone = phone;
            Organization = organization;
        }
    }
}