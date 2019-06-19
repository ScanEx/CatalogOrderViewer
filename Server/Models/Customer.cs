using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{    
    [Table("customers")]
    public class Customer
    {
        public Customer() { }
        [Key, Column("custid")]
        public int Id { get; set; }
        [Column("cust_name")]
        public string Name { get; set; }
        [Column("contact_name")]
        public string ContactName { get; set; }
        [Column("contact_email")]
        public string Email { get; set; }
        [Column("contact_phone")]
        public string Phone { get; set; }

        public virtual List<Order> Orders { get; set; }
    }
}