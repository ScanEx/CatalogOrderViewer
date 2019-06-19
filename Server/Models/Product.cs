using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("dict_Dtypes")]
    public class Product {
        public Product () {}
        [Column("id")]
        public int Id { get; set; }
        [Column("dt_name")]
        public string Name { get; set; }
    }
}