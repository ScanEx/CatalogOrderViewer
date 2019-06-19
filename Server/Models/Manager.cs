using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("Users")]
    public class Manager
    {
        public Manager () {}
        [Key, Column("id")]
        public int Id { get; set; }        
        [Column("Name")]
        public string Name { get; set; }
    }
}