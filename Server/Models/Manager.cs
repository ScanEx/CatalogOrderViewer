using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("manager", Schema="catalog")]
    public class Manager
    {
        public Manager () {}
        [Key, Column("manager_id")]
        public int Id { get; set; }        
        [Column("manager_name")]
        public string Name { get; set; }
    }
}