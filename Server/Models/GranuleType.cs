using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("granule_type", Schema="catalog")]
    public class GranuleType
    {
        public GranuleType () {}
        [Key, Column("granule_type_id")]
        public int Id { get; set; }        
        [Column("granule_type_name")]
        public string Name { get; set; }
    }
}