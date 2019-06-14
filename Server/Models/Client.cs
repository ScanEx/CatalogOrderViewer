using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{    
    [Table("client", Schema="catalog")]
    public class Client
    {
        public Client() { }
        [Column("client_id")]
        public int Id { get; set; }
        [Column("client_name")]
        public string Name { get; set; }
        [Column("client_agent")]
        public string Agent { get; set; }
        [Column("client_email")]
        public string Email { get; set; }
        [Column("client_phone")]
        public string Phone { get; set; }

        public virtual List<Order> Orders { get; set; }
    }
}