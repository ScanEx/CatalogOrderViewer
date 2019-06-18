using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("granule", Schema="catalog")]
    public class Granule
    {
        public Granule () {}
        [Key, Column("granule_id")]
        public int Id { get; set; }
        [Column("granule_type_id")]
        public int TypeId { get; set; }
        [ForeignKey("TypeId")]
        public virtual GranuleType Type { get; set; }
        [Column("order_id")]
        public int OrderId { get; set; }
        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; }
        [Column("scene_id")]
        public string SceneId { get; set; }
        [ForeignKey("SceneId")]
        public virtual Scene Scene { get; set; }
        [Column("part")]
        public int Part { get; set; }
        [Column("rate")]
        public int Rate { get; set; }
        [Column("part_cost")]
        public int PartCost { get; set; }
        [Column("cost")]
        public int Cost { get; set; }
        [Column("area")]
        public int Area { get; set; }
        [Column("discount")]
        public int Discount { get; set; }   
        [Column("handling")]
        public string Handling { get; set; }
        [Column("handling_cost")]
        public int HandlingCost { get; set; }
        [Column("handling_discount")]
        public int HandlingDiscount { get; set; }
        [Column("handling_rate")]
        public int HandlingRate { get; set; }
    }
}