using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("ord_granules")]
    public class Granule
    {
        public Granule () {}
        [Key, Column("gran_id")]
        public string Id { get; set; }
        [Column("roi_id")]
        public int RegionId { get; set; }
        [ForeignKey("RegionId")]
        public virtual Region Region { get; set; }
        [Column("dtype")]
        public int ProductType { get; set; }
        [ForeignKey("ProductType")]
        public virtual Product Product { get; set; }
    }
}