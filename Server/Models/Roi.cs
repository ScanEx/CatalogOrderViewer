using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("roi", Schema="catalog")]
    public class Roi
    {
        public Roi () {}
        [Key, Column("roi_id")]
        public int Id { get; set; }
        [Column("file_path")]
        public string FilePath { get; set; }
        [Column("order_id")]
        public int OrderId { get; set; }
        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; }
    }
}