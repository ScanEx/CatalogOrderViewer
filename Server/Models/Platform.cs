using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("platform", Schema="catalog")]
    public class Platform
    {
        public Platform () {}
        [Key, Column("platform_id")]
        public int Id { get; set; }
        [Column("platform_name")]
        public string Name { get; set; }
        [Column("platform_table_name")]
        public string TableName { get; set; }
    }
}