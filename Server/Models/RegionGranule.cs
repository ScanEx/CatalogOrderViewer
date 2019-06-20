using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("roi_gran")]
    public class RegionGranule
    {
        public RegionGranule () {}
        [Column("roi_id")]
        public int RegionId { get; set; }
        [ForeignKey("RegionId")]
        public virtual Region Region { get; set; }
        [Column("gran_id")]
        public int GranuleId { get; set; }
        [ForeignKey("GranuleId")]
        public virtual Granule Granule { get; set; }

    }
}