using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("platform_2_parameter", Schema="catalog")]
    public class PlatformParameter
    {
        public PlatformParameter () {}
        [Key, Column("platform_2_parameter_id")]
        public int Id { get; set; }
        [Column("platform_id")]
        public int PlatformId { get; set; }
        [ForeignKey("PlatformId")]
        public virtual Platform Platform { get; set; }
        [Column("parameter_id")]
        public int ParameterId { get; set; }
        [ForeignKey("ParameterId")]
        public virtual Parameter Parameter { get; set; }
    }
}