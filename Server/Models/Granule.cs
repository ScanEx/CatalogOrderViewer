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
        [Key, Column("uid")]
        public int Id { get; set; }
        [Column("dtype")]
        public int ProductType { get; set; }
        [Column("gran_id")]
        public string SceneId { get; set; }
        [ForeignKey("ProductType")]        
        public virtual Product Product { get; set; }
        public virtual List<RegionGranule> Regions { get; set; }
    }
}