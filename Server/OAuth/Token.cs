using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Server.OAuth {
    public class Token
    {
        public int Version { get; set; }
        public string EMail { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime Expiration { get; set; }
        public bool IsPersistent { get; set; }
        public string ClientData { get; set; }
        //public string TokenString { get; private set; }
        //public DateTime Expires { get; private set; }
        public readonly string TokenString;
        public readonly DateTime Expires;

        public Token(){}

        public Token(string token, DateTime expires)
        {
            TokenString = token;
            Expires = expires;
        }

        // /// <summary>
        // /// Возвращает зашифрованный токен
        // /// </summary>
        // /// <returns></returns>
        // public override string ToString()
        // {
        //     return getToken(Version, EMail, IssueDate, Expiration, IsPersistent, ClientData);
        // }
        
        // public static Token Decrypt(string encTicket)
        // {
        //     if (String.IsNullOrEmpty(encTicket)) return null;
        //     FormsAuthenticationTicket authTicket = null;
        //     try
        //     {
        //         authTicket = FormsAuthentication.Decrypt(encTicket);
        //     }
        //     catch (Exception)
        //     {
        //         return null;
        //     }
        //     if (authTicket == null) return null;
        //     return new Token()
        //     {
        //         Version = authTicket.Version,
        //         EMail = authTicket.Name,
        //         IssueDate = authTicket.IssueDate,
        //         Expiration = authTicket.Expiration,
        //         IsPersistent = authTicket.IsPersistent,
        //         ClientData = authTicket.UserData
        //     };
        // }

        public static string Validate(Token token)
        {
            if (token == null) return "INVALID_TOKEN";
            if (token.Expiration < DateTime.Now) return "TOKEN_EXPIRES";
            return "";
        }

        // /// <summary>
        // /// Возврщает токен - зашифрованную строку, олицетворяющую доступ
        // /// </summary>
        // /// <param name="version">версия</param>
        // /// <param name="eMail">пользователь</param>
        // /// <param name="issueDate">дата выдачи</param>
        // /// <param name="expiration">годен до</param>
        // /// <param name="isPersistent">постоянный</param>
        // /// <param name="client_id">данные клиента</param>
        // /// <returns></returns>
        // public static string getToken(int version, string eMail, DateTime issueDate, DateTime expiration, bool isPersistent, string client_data)
        // {
        //     var authTicket = new FormsAuthenticationTicket(version, eMail, issueDate, expiration, isPersistent, client_data);
        //     string encTicket = FormsAuthentication.Encrypt(authTicket);
        //     return encTicket;
        // }

        // /// <summary>
        // /// Возвращает временный токен authorization_code для обмена на постоянный
        // /// </summary>
        // /// <param name="version">версия</param>
        // /// <param name="eMail">пользователь</param>
        // /// <param name="issueDate">дата выдачи</param>
        // /// <param name="expiration">годен до</param>
        // /// <param name="client_id">данные клиента</param>
        // /// <returns></returns>
        // public static string getCode(int version, string eMail, DateTime issueDate, DateTime expiration, string client_data)
        // {
        //     string encTicket = getToken(version, eMail, issueDate, expiration, false, client_data);
        //     return encTicket;
        // }
    }
}